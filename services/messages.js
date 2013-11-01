var async = require('async')
  , config = require('../config')
  , fs = require('fs')
  , log = require('../log')
  , models = require('../models')
  , path = require('path')
  , revalidator = require('revalidator')
  , services = require('../services')
  , utils = require('../utils');

var buildVisibility = function(message, callback) {
    // if the creator has already marked this as public, shortcircuit.
    if (message.public) return callback(null, message);

    // find all 'subscribe' permissions
    services.permissions.find({ principal_for: message.from, type: 'subscribe' }, {}, function(err, permissions) {
        if (err) return callback(err);

        message.public = false;
        message.visible_to = message.to ? [message.to] : [];
        permissions.forEach(function(permission) {
            if (!message.public) {
                if (permission.issued_to) {
                    message.visible_to.push(permission.issued_to);
                } else {
                    message.visible_to = [];
                    message.public = true;
                }
            }
        });

        return callback(null, message);
    });
};

var create = function(principal, message, callback) {

    translate(message);

    validate(message, function(err, fromPrincipal, toPrincipal) {
        if (err) return callback(err);

        services.permissions.authorize({
            principal: principal,
            principal_for: toPrincipal, 
            action: 'send'
        }, message, function(err, permission) {
            if (err) return callback(err);
            if (!permission.authorized) {
                log.warn('principal: ' + principal.id + ' attempted unauthorized send of message: ' + JSON.stringify(message));
                return callback(utils.authorizationError());  
            } 

            if (message.is('log'))
                log.log(message.body.severity, message.body.message, { principal: message.from.toString() });

            buildVisibility(message, function(err, message) { 
                if (err) return callback(err);

                message.body_length = JSON.stringify(message.body).length;
                message.created_at = new Date();

                message.save(function(err, message) {
                    if (err) return callback(err);

                    services.subscriptions.publish('message', message, function(err) {
                        callback(err, [message]);
                    });
                });
            });
        });
    });
};

var createMany = function(principal, messages, callback) {
    validateAll(messages, function(err) {
        if (err) return callback(err);

        async.concat(messages, function(message, cb) {
            create(principal, message, cb);
        }, callback);
    });
};

var filterForPrincipal = function(principal, filter) {
    if (principal && principal.is('service')) return filter;

    var visibilityClauses = [ { public: true } ];
    if (principal) {
        visibilityClauses.push({ visible_to: principal._id });
    }

    return { $and: [filter, { $or: visibilityClauses }] };
};

var find = function(principal, filter, options, callback) {
    var translatedFilter = utils.translateQuery(filter, models.Message.fieldTranslationSpec);

    models.Message.find(filterForPrincipal(principal, translatedFilter), null, options, function(err, messages) {
        if (err) return callback(err);

        return callback(null, messages);
    });
};

var findById = function(principal, messageId, callback) {
    models.Message.findOne(filterForPrincipal(principal, { "_id": messageId }), function(err, message) {
        if (err) return callback(err);

        return callback(null, message);
    });
};

var initialize = function(callback) {
    if (config.validate_schemas) {
        loadSchemaAndClients('./');
    }

    return callback();
};

var schemas = {};
var clients = {
    'nitrogen-min.js': "",
    'nitrogen.js': ""
};

var loadClientPlugin = function(fullPath, clientFile) {
    var clientPath = path.join(fullPath, clientFile);

    if (clientFile === 'nitrogen.js' || clientFile === 'nitrogen-min.js') {
        log.info('adding client plugin: ' + clientFile + ' from: ' + fullPath);
        clients[clientFile] += fs.readFileSync(clientPath);
    }
};

var loadSchema = function(fullPath, schemaFile) {
    var schemaPath = path.join(fullPath, schemaFile);

    log.info('loading schema: ' + schemaFile + ' from: ' + schemaPath);
    var schemaText = fs.readFileSync(schemaPath);
    schemas[schemaFile] = JSON.parse(schemaText);
};

var processDirectoryItem = function(itemPath, item) {
    var fullPath = path.join(itemPath, item);

    var stats = fs.statSync(fullPath);
    // ignore files
    if (stats.isDirectory()) {

        // if the directory's name is schemas, we parse all of the contents as schemas.
        if (item === 'schemas') {
            log.info('parsing schemas in path: ' + fullPath);
            var schemas = fs.readdirSync(fullPath);
            schemas.forEach(function(schemaFile) {
                loadSchema(fullPath, schemaFile);
            });
        } else if (item === 'browser') {
            var clients = fs.readdirSync(fullPath);
            clients.forEach(function(clientFile) {
                loadClientPlugin(fullPath, clientFile);
            });
        } else {
            loadSchemaAndClients(fullPath);
        }
    }
};

var loadSchemaAndClients = function(path) {
    var items = fs.readdirSync(path);
    items.forEach(function(item) {
        processDirectoryItem(path, item);
    });
};

var remove = function(principal, query, callback) {
    // TODO: will need more complicated authorization mechanism for non service users.
    if (!principal || !principal.is('service')) return callback(utils.authorizationError());

    find(principal, query, {}, function (err, messages) {
        if (err) return callback(err);

        // delete linked resources and then the message itself.
        // TODO: what is an appropriate max parallelism here.
        async.eachLimit(messages, 50, removeLinkedResources, function(err) {
            if (err) return callback(err);

            models.Message.remove(query, callback);
        });
    });
};

var removeLinkedResources = function(message, callback) {
    if (!message.link) return callback();

    log.info("removing linked resources with link: " + message.link);
    services.blobs.remove(services.principals.servicePrincipal, { link: message.link }, callback);
};

var removeOne = function(principal, message, callback) {
    if (!principal || !principal.is('service')) return callback(utils.authorizationError());

    removeLinkedResources(message, function(err) {
        if (err) return callback(err);

        models.Message.remove({"_id": message.id}, callback);
    });
};

var translate = function(message) {
    if (!message.expires) {
        message.expires = utils.dateDaysFromNow(config.default_message_lifetime);
    }

    if (message.expires === 'never') {
        message.expires = models.Message.NEVER_EXPIRE;
    }

    if (message.to === 'service') {
        message.to = services.principals.servicePrincipal.id;
    }
};

var validate = function(message, callback) {
    if (!message.from)
        return callback(utils.badRequestError('Message must have a from principal.'));

    if (!message.type)
        return callback(utils.badRequestError('Message must have a message type.'));

    var validationFunction = config.validate_schemas ? validateSchema : utils.nop;
    validationFunction(message, function(err, result) {
        if (err) return callback(err);
        if (!result.valid) return callback(result.errors);

        services.principals.findById(services.principals.servicePrincipal, message.from, function(err, fromPrincipal) {
            if (err) return callback(err);
            if (!fromPrincipal) return callback(utils.badRequestError('Message must have an existing from principal.'));

            if (!message.to) return callback(null, fromPrincipal, null);

            services.principals.findById(services.principals.servicePrincipal, message.to, function(err, toPrincipal) {
                if (err) return callback(err);
                if (!toPrincipal) return callback(utils.badRequestError('Principal in to: field (' + message.to +') of message not found.'));

                callback(null, fromPrincipal, toPrincipal);
            });
        });
    });
};

var validateSchema = function(message, callback) {
    if (message.isCustomType()) return callback(null, { valid: true });
    if (!(message.type in schemas)) return callback(utils.badRequestError('Message type (' + message.type + ') not recognized.  Custom message types must be prefixed by _'));

    var results = revalidator.validate(message.body, schemas[message.type]);
    if (!results.valid) {
        log.info("message validation failed with errors: " + JSON.stringify(results.errors));
    }
    callback(null, results);
};

var validateAll = function(messages, callback) {
    async.every(messages, validate, callback);
};

module.exports = {
    clients: clients,
    create: create,
    createMany: createMany,
    filterForPrincipal: filterForPrincipal,
    find: find,
    findById: findById,
    initialize: initialize,
    remove: remove,
    removeOne: removeOne,
    translate: translate,
    validate: validate,
    validateAll: validateAll
};

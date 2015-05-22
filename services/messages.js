var async = require('async')
  , config = require('../config')
  , fs = require('fs')
  , log = require('../log')
  , models = require('../models')
  , moment = require('moment')
  , mongoose = require('mongoose')
  , path = require('path')
  , revalidator = require('revalidator')
  , services = require('../services')
  , utils = require('../utils');

var buildVisibility = function(message, callback) {
    // if the creator has already marked this as public, shortcircuit.
    // if (message.public) return callback(null, message);

    // find all permissions for from: principal
    services.permissions.permissionsForCached(message.from, function(err, permissions) {
        if (err) return callback(err);

        //message.public = false;

        var authorizedHash = {};
        authorizedHash[message.from] = true;

        if (message.to)
            authorizedHash[message.to] = true;

        // iterate through permissions in priority order.
        // track specific or all-principals authorizations.
        permissions.forEach(function(permission) {
            if (!permission.action || permission.action === 'subscribe') {
                if (permission.issued_to) {
                    if (!authorizedHash[permission.issued_to] && permission.authorized)
                        authorizedHash[permission.issued_to] = true;
                }
                // else {
                //    message.public = true;
                //}
            }
        });

        // message.visible_to = message.public ? [] : Object.keys(authorizedHash);
        message.visible_to = Object.keys(authorizedHash);

        log.debug('final message visibility: ' + message.visible_to);

        return callback(null, message);
    });
};

var checkFrom = function(principal, message, callback) {
    if (!message.from || message.from.equals(principal.id))
        return callback(null, new models.Permission({ authorized: true }));

    services.permissions.authorize({
        principal: principal.id,
        principal_for: message.from,
        action: 'admin'
    }, message, callback);
};

var count = function(query, callback) {
    models.Message.count(query, callback);
};

var create = function(principal, msg, callback) {
    var message = translate(msg);

    delete message.created_at;
    message._id = new mongoose.Types.ObjectId();

    if (!message.from) message.from = principal.id;

    validate(message, function(err, fromPrincipal, toPrincipal) {
        if (err) return callback(err);

        checkFrom(principal, message, function(err, permission) {
            if (err) return callback(err);

            if (!permission.authorized) {
                log.warn('principal: ' + principal.id + ' attempted to send message with from: of another principal: ' + JSON.stringify(message));
                return callback(utils.authorizationError());
            }

            var toPrincipalId = toPrincipal ? toPrincipal.id : undefined;

            services.permissions.authorize({
                principal: principal.id,
                principal_for: toPrincipalId,
                action: 'send'
            }, message, function(err, permission) {
                if (err) return callback(err);
                if (!permission.authorized) {
                    log.warn('principal: ' + principal.id + ' attempted unauthorized send of message: ' + JSON.stringify(message));
                    return callback(utils.authorizationError());
                }

                buildVisibility(message, function(err, message) {
                    if (err) return callback(err);

                    message.id = new mongoose.Types.ObjectId();
                    message.body_length = JSON.stringify(message.body).length;

                    message.tags.push('involves:' + fromPrincipal.id);
                    if (toPrincipal) message.tags.push('involves:' + toPrincipal.id);

                    if (message.index_until.getTime() > new Date().getTime()) message.save(function(err, message) {
                        if (err) log.error('message service create: save error: ' + err);
                    });

                    services.subscriptions.publish('message', message, function(err) {
                        if (err) log.error('message service create: publish error: ' + JSON.stringify(err));
                        return callback(null, [message]);
                    });

                    if (config.archive_providers) {
                        async.each(config.archive_providers, function(archiveProvider, providerCallback) {
                            archiveProvider.archive(message, providerCallback);
                        }, function(err) {
                            if (err) log.error('messages service create: archive_provider error: ' + err);
                        });
                    }
                });
            });
        });
    });
};

var createMany = function(principal, messages, callback) {
    var ts = new Date();

    async.concat(messages, function(message, cb) {
        if (!message.ts) {
            message.ts = ts;
            // increment the timestamp of the next message (if any) by 1ms to preserve ordering in message stream.
            ts = new Date(ts.getTime() + 1);
        }

        create(principal, message, cb);
    }, callback);
};

var find = function(principal, filter, options, callback) {
    if (!models.Message.filterHasIndex(filter)) return callback(utils.badRequestError("filter: " + JSON.stringify(filter) + " does not have an index."));
    var translatedFilter = utils.translateQuery(filter, models.Message.fieldTranslationSpec);
    var filter = services.principals.filterForPrincipal(principal, translatedFilter);

    log.debug('final message query filter: ' + JSON.stringify(filter));

    models.Message.find(filter, null, options, callback);
};

var findById = function(principal, messageId, callback) {
    models.Message.findOne(services.principals.filterForPrincipal(principal, { "_id": messageId }), function(err, message) {
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

    // don't add dependencies of dependencies
    if (fullPath.split('node_modules').length > 2)
        return;

    if (clientFile === 'nitrogen.js' || clientFile === 'nitrogen-min.js') {
        log.info('adding client plugin: ' + clientFile + ' from: ' + fullPath);
        clients[clientFile] += fs.readFileSync(clientPath);
    }
};

var loadSchema = function(fullPath, schemaFile) {
    var schemaPath = path.join(fullPath, schemaFile);

    log.info('messages: loading schema: ' + schemaFile + ' from: ' + schemaPath);
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
                // We only want to load pure JSON files
                if (/\.json$/.test(schemaFile)) {
                    loadSchema(fullPath, schemaFile);
                }
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
        if (item !== 'newrelic')
            processDirectoryItem(path, item);
    });
};

var remove = function(principal, filter, callback) {
    if (!principal || !principal.is('service')) return callback(utils.authorizationError());

    var totalRemoved = 0;

    // remove all of the messages without links first
    filter.link = { $exists: false };
    models.Message.remove(filter, function(err, removed) {
        if (err) return callback(err);

        delete filter.link;

        totalRemoved += removed;

        // now requery for the messages with links and do the slower cascading deletes for them.
        find(principal, filter, {}, function (err, messages) {
            if (err) return callback(err);

            async.each(messages, function(message, messageCallback) {
                removeOne(principal, message, messageCallback);
            }, function(err) {
                if (err) return callback(err);

                totalRemoved += messages.length;
                return callback(null, totalRemoved);
            });
        });

    });
};

var removeLinkedResources = function(message, callback) {
    // the vast majority of messages will have no link and will immediately callback.
    if (!message.link) return callback();

    log.info("message service: removing linked resources with link: " + message.link);
    services.blobs.remove(services.principals.servicePrincipal, { link: message.link }, callback);
};

var removeOne = function(principal, message, callback) {
    if (!principal || !principal.is('service')) return callback(utils.authorizationError());

    removeLinkedResources(message, function(err) {
        if (err) return callback(err);

        message.remove(callback);
    });
};

var translate = function(message) {
    if (!message.index_until) {
        message.index_until = moment().add('days', config.default_message_indexed_lifetime).toDate();
    }

    if (message.index_until === 'forever') {
        message.index_until = models.Message.INDEX_FOREVER;
    }

    if (!message.expires || message.expires === 'never') {
        message.expires = models.Message.NEVER_EXPIRE;
    }

    if (message.to === 'service') {
        message.to = services.principals.servicePrincipal.id;
    }

    // convert json/object to model if needed
    if (!models.Message.isPrototypeOf(message))
        message = new models.Message(message);

    return message;
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

        services.principals.findByIdCached(services.principals.servicePrincipal, message.from, function(err, fromPrincipal) {
            if (err) return callback(err);
            if (!fromPrincipal) return callback(utils.badRequestError('From: principal on message was not found.'));

            if (!message.to) return callback(null, fromPrincipal, null);

            services.principals.findByIdCached(services.principals.servicePrincipal, message.to, function(err, toPrincipal) {
                if (err) return callback(err);
                if (!toPrincipal) return callback(utils.badRequestError('Principal in to: field (' + message.to +') of message not found.'));

                callback(null, fromPrincipal, toPrincipal);
            });
        });
    });
};

var validateSchema = function(message, callback) {
    if (message.isCustomType()) return callback(null, { valid: true });
    if (!(message.type in schemas)) {
        return callback(utils.badRequestError('Message type (' + message.type + ') not recognized.  Custom message types must be prefixed by _'));
    }

    var results = revalidator.validate(message.body, schemas[message.type]);
    if (!results.valid) {
        log.warn("message validation failed with errors: " + JSON.stringify(results.errors));
        log.warn("message: " + message);
    }
    callback(null, results);
};

var validateAll = function(messages, callback) {
    async.every(messages, validate, callback);
};

module.exports = {
    clients: clients,
    count: count,
    create: create,
    createMany: createMany,
    find: find,
    findById: findById,
    initialize: initialize,
    remove: remove,
    removeOne: removeOne,
    translate: translate,
    validate: validate,
    validateAll: validateAll
};

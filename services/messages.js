var async = require('async')
  , fs = require('fs')
  , log = require('../log')
  , models = require('../models')
  , revalidator = require('revalidator')
  , services = require('../services')
  , utils = require('../utils');

var create = function(message, callback) {

    translate(message);

    validate(message, function(err, fromPrincipal, toPrincipal) {
        if (err) return callback(err);

        // the from and to principals and their owners can see this message.
        message.visible_to = [message.from];
        if (fromPrincipal.owner) message.visible_to.push(fromPrincipal.owner);
        if (message.to) message.visible_to.push(message.to);
        if (toPrincipal && toPrincipal.owner) message.visible_to.push(toPrincipal.owner);

        if (message.is("log"))
            log.log(message.body.severity, message.body.message, { principal: message.from.toString() });

        message.body_length = JSON.stringify(message.body).length;

        message.save(function(err, message) {
            if (err) return callback(err);

            var client_json = JSON.stringify(message);
            log.info("created message: " + message.id + ": " + client_json);

            message.visible_to.forEach(function(principalId) {
                log.info("publishing message " + message.id + " to principal: " + principalId + " on " + '/messages/' + principalId);
                services.realtime.publish('/messages/' + principalId, client_json);
            });

            callback(null, [message]);
        });
    });
};

var createMany = function(messages, callback) {
    validateAll(messages, function(err) {
        if (err) return callback(err, []);

        async.concat(messages, create, callback);
    });
};

var filterForPrincipal = function(principal, filter) {
    if (principal && principal.is('system')) return filter;

    var visibilityFilter = [ { public: true } ];
    if (principal) {
        visibilityFilter.push( { visible_to: principal._id } );
    }

    filter["$or"] = visibilityFilter;
    return filter;
};

var find = function(principal, filter, options, callback) {
    models.Message.find(filterForPrincipal(principal, filter), null, options, function(err, messages) {
        if (err) return callback(err);

        return callback(null, messages);
    });
};

var findById = function(principal, messageId, callback) {
    models.Message.findOne(filterForPrincipal(principal, { "_id": messageId }), function(err, message) {
        if (err) return callback(err);
        if (!message) return callback(404);

        return callback(null, message);
    });
};

var initialize = function(callback) {
    loadSchemas(callback);
};

var schemaPath = "./schemas";
var schemas = {};

var loadSchema = function(type, callback) {
    fs.readFile(schemaPath + "/" + type, function (err, schemaText) {
        if (err) return callback(err);

        schemas[type] = JSON.parse(schemaText);
        callback(null);
    });
};

var loadSchemas = function(callback) {
    schemas = {};
    fs.readdir(schemaPath, function(err, schemas) {
        if (err) return callback(err);
        async.each(schemas, loadSchema, callback);
    });
};

var remove = function(principal, query, callback) {
    // TODO: will need more complicated authorization mechanism for non system users.
    if (!principal || !principal.is('system')) return callback(403);

    find(principal, query, { limit: 500 }, function (err, messages) {
        if (err) return callback(messages);

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
    services.blobs.remove(services.principals.systemPrincipal, { link: message.link }, callback);
};

var removeOne = function(principal, message, callback) {
    if (!principal || !principal.is('system')) return callback("Only system can delete messages");

    removeLinkedResources(message, function(err) {
        if (err) return callback(err);

        models.Message.remove({"_id": message.id}, callback);
    });
};

var translate = function(message) {
    if (!message.expires) {
        message.expires = utils.dateDaysFromNow(1);
    }

    if (message.expires === 'never') {
        message.expires = null;
    }

    if (message.to === 'system') {
        message.to = services.principals.systemPrincipal.id;
    }
};

var validate = function(message, callback) {
    if (!message.from)
        return callback("Message must have a from principal.");

    if (!message.type)
        return callback("Message must have a message type.");

    validateSchema(message, function(err, result) {
        if (err) return callback(err);
        if (!result.valid) return callback(result.errors);

        services.principals.findById(services.principals.systemPrincipal, message.from, function(err, fromPrincipal) {
            if (err) return callback(err);
            if (!fromPrincipal) return callback("Message must have an existing from principal.");

            if (!message.to) return callback(null, fromPrincipal, null);

            services.principals.findById(services.principals.systemPrincipal, message.to, function(err, toPrincipal) {
                if (err) return callback(err);
                if (!toPrincipal) return callback('Principal in to: field (' + message.to +') of message not found.');

                callback(null, fromPrincipal, toPrincipal);
            });
        });
    });
};

var validateSchema = function(message, callback) {
    if (message.isCustomType()) return callback(null, { valid: true });
    if (!message.type in schemas) return callback("Message type not recognized.  Custom message types must be prefixed by _");

    var results = revalidator.validate(message.body, schemas[message.type]);
    if (!results.valid) {
        log.info("message validation failed with errors: " + results.errors);
    }
    callback(null, results);
};

var validateAll = function(messages, callback) {
    async.every(messages, validate, callback);
};

module.exports = {
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

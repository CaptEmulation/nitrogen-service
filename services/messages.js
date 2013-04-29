var async = require('async')
  , log = require('../log')
  , models = require('../models')
  , services = require('../services')
  , utils = require('../utils');

var create = function(message, callback) {
    if (!message.expires) {
        message.expires = utils.dateDaysFromNow(5);
    }

    // map special case constants 
    if (message.expires === 'never') {
        message.expires = null;
    }

    if (message.to === 'system') {
        message.to = services.principals.systemPrincipal.id;
    }

    validate(message, function(err) {
        if (err) return callback(err);

        message.visible_to = [message.from];
        if (message.to) message.visible_to.push(message.to);

        if (message.message_type === "log") 
            log.log(message.body.severity, message.body.message, { principal: message.from.toString() });

        message.save(function(err, message) {
            if (err) return callback(err);

            var client_json = JSON.stringify(message);
            log.info("created message: " + message.id + ": " + client_json);

            services.realtime.publish('/messages', client_json);

            callback(null, [message]);
        });
    });
};

var createMany = function(messages, callback) {
    validateAll(messages, function(err) {
        if (err) return callback(err, []);

        async.concat(messages, create, function(err, saved_messages) {
            if (err) {
                // rollback any already saved_messages
                async.each(saved_messages, remove, function(err2) {
                    log.error("error during rollback: " + err2);
                    return callback(err, []);
                });
            }

            callback(null, saved_messages);
        });

    });
};

var filterForPrincipal = function(principal, filter) {
    if (principal && principal.isSystem()) return filter;

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

var remove = function(principal, query, callback) {
    // TODO: will need more complicated authorization mechanism for non system users.
    if (!principal || !principal.isSystem()) return callback(403);

    models.Message.find(filterForPrincipal(principal, query), function (err, messages) {

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

    services.blobs.remove(services.principals.systemPrincipal, { link: message.link }, callback);
};

var removeOne = function(principal, message, callback) {
    if (!principal || !principal.isSystem()) return callback("Only system can delete messages");

    removeLinkedResources(message, function(err) {
        if (err) return callback(err);

        models.Message.remove({"_id": message.id}, callback);
    });
};

var validate = function(message, callback) {
    if (!message.from)
        return callback("Message must have a from principal.");

    if (!message.message_type)
        return callback("Message must have a message type.");

    // TODO: do validation of message_type values if they are not custom prefixed
    if (!message.message_type in ["claim", "heartbeat", "image", "ip_match", "reject"] && !message_message_type[0] === "_") {
        return callback("Message type not recognized.  Custom message types must be prefixed by _");
    }

    // TODO: schema validation of messages
    validateSchema(message, function(err) {
        if (err) return callback(err);

        services.principals.findById(services.principals.systemPrincipal, message.from, function(err, principal) {
            if (err) return callback(err);
            if (!principal) return callback("Message must have an existing from principal.");

            callback(null);
        });
    });
};

var validateSchema = function(message, callback) {
    callback(null);
};

var validateAll = function(messages, callback) {
    async.every(messages, validate, callback);
};

module.exports = {
    create: create,
    createMany: createMany,
    find: find,
    findById: findById,
    remove: remove,
    removeOne: removeOne,
    validate: validate,
    validateAll: validateAll
};

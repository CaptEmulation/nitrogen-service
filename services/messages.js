var async = require("async")
  , models = require("../models");

var create = function(message, callback) {
    if (!message.expires) {
        var defaultExpirationDate = new Date();
        defaultExpirationDate.setDate(new Date().getDate() + 30);

        message.expires = defaultExpirationDate;
    }

    validate(message, function(err) {
        if (err) return callback(err, []);

        message.save(function(err, message) {
            if (err) return callback(err, []);

            var client_json = JSON.stringify(message);

            console.log("created message: " + message.id + ": " + client_json);

            global.bayeux.getClient().publish('/messages', client_json);
            global.bayeux.getClient().publish('/messages/type/' + message.message_type, client_json);

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
                    console.log("error during rollback: " + err2);
                    return callback(err, []);
                });
            }

            callback(null, saved_messages);
        });

    });
};

var find = function(filter, start, limit, sort, callback) {
    models.Message.find(filter, null, {
        skip: start,
        limit: limit,
        sort: sort
    }, callback);
};

var findById = function(messageId, callback) {
    models.Message.findOne({"_id": messageId}, callback);
};

var remove = function(message, callback) {
    models.Message.remove({"_id": message.id}, callback);
};

var validate = function(message, callback) {
    if (!message.from)
        return callback("Message must have a from principal.");

    if (!message.message_type)
        return callback("Message must have a message type.");

    // TODO: do validation of message_type values if they are not prefixed custom
    // TODO: schema validation of messages

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
    validate: validate,
    validateAll: validateAll
};
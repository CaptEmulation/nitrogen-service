var async = require("async"),
    models = require("../models");

var create = function(message, callback) {
    if (!message.expires) {
        var defaultExpirationDate = new Date();
        defaultExpirationDate.setDate(new Date().getDate() + 30);

        message.expires = defaultExpirationDate;
    }

    validate(message, function(result) {
        if (!result) return callback("One or more messages did not validate", []);

        message.save(function(err, message) {
            if (err) return callback(err, []);

            var client_message = message.toClientObject();

            console.log("created message: " + message.id + ": " + JSON.stringify(client_message));

            global.bayeux.getClient().publish('/messages', client_message);
            global.bayeux.getClient().publish('/messages/type/' + client_message.message_type, client_message);

            callback(null, [client_message]);
        });
    });
};

var createMany = function(messages, callback) {
    validateAll(messages, function(result) {
        if (!result) return callback("One or more messages did not validate", []);

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

var validate = function(message, callback) {
    if (!message.from)
        return callback(false);

    if (!message.message_type)
        return callback(false);

    callback(true);
};

var validateAll = function(messages, callback) {
    async.every(messages, validate, callback);
};

var remove = function(message, callback) {
    models.Message.remove({"_id": message.id}, function (err) {
        callback(err);
    })
};

module.exports = {
    create: create,
    createMany: createMany,
    remove: remove,
    validate: validate,
    validateAll: validateAll
};
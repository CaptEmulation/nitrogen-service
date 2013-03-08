var async = require("async"),
    models = require("../models");

exports.create = function(message, callback) {
    if (!message.expires) {
        var defaultExpirationDate = new Date();
        defaultExpirationDate.setDate(new Date().getDate() + 30);

        message.expires = defaultExpirationDate;
    }

    message.save(function(err, message) {
        if (err) return callback(err, []);

        var client_message = message.toClientObject();

        console.log("created message: " + message.id + ": " + JSON.stringify(client_message));

        global.bayeux.getClient().publish('/messages', client_message);
        global.bayeux.getClient().publish('/messages/type/' + client_message.message_type, client_message);

        callback(null, [client_message]);
    });
}

exports.createMany = function(messages, callback) {
    async.concat(messages, exports.create, function(err, saved_messages) {
        if (err) {
            // rollback all saved_messages
            async.each(saved_messages, exports.remove, function(err2) {
                console.log("rollback error: " + err2);
                return callback(err, []);
            });
        }

        callback(null, saved_messages);
    });
}

exports.remove = function(message, callback) {
    models.Message.remove({"_id": message.id}, function (err) {
        callback(err);
    })
}
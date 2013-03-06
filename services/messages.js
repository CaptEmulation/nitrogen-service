var models = require("../models");

exports.create = function(message, callback) {
    if (!message.expires) {
        var defaultExpirationDate = new Date();
        defaultExpirationDate.setDate(new Date().getDate() + 30);

        message.expires = defaultExpirationDate;
    }

    message.save(function(err, message) {
        if (err) return callback(err, null);

        var client_message = message.toClientObject();

        console.log("created message: " + message.id + ": " + JSON.stringify(client_message));

        global.bayeux.getClient().publish('/messages', client_message);
        global.bayeux.getClient().publish('/messages/type/' + client_message.message_type, client_message);

        callback(null, client_message);

    }.bind(this));
}

exports.createMany = function(messages, callback) {
    var count = 0;
    var saved_messages = [];
    var failed = false;

    messages.forEach(function(message) {
        if (failed) return;

        exports.create(message, function(err, saved_message) {
            count += 1;

            if (err) {
                failed = true;

                // rollback all saved_messages
                saved_messages.forEach(function(message_for_delete) {
                    exports.remove(message_for_delete);
                });

                // callback immediately.
                callback(err, []);
            }

            saved_messages.push(saved_message);

            if (count == messages.length) {
                callback(err, saved_messages);
            }
        });
    });
}

exports.remove = function(message, callback) {
    models.Message.remove({"_id": message.id}, function (err) {
        callback(err);
    })
}
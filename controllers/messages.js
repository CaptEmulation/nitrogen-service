var async = require('async')
  , config = require('../config')
  , faye = require('faye')
  , models = require('../models')
  ,	services = require('../services');

exports.index = function(req, res) {
    services.messages.find(req.user, req.query, { limit: 400, sort: { timestamp: -1 } }, function(err, messages) {
        if (err) return res.send(400, err);

        res.send({ "messages": messages });
    });
};

exports.show = function(req, res) {
    services.messages.findById(req.user, req.params.id, function(err, message) {
		if (err) return res.send(400, err);
		if (!message) return res.send(404);

		res.send({ "message": message });
	});
};

exports.create = function(req, res) {
    async.concat(req.body, function(message_object, callback) {
        var message = new models.Message(message_object);

        // force message to be from POSTing principal.
        message.from = req.user.id;

        callback(null, [message]);
    }, function (err, messages) {
        services.messages.createMany(messages, function(err, saved_messages) {
            if (err)
                res.send(400, err);
            else
                res.send({ "messages": saved_messages });
        });
    });
};

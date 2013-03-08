var async = require('async'),
    config = require('../config'),
    faye = require('faye'),
	models = require('../models'),
	services = require('../services');

exports.index = function(req, res) {
	// TODO: paging
	var start = 0;
	var limit = 200;

	models.Message.find({}, null, {
		skip: start,
		limit: limit,
	    sort:{ timestamp: -1 }
	}, function (err, messages) {
		if (err) return res.send(400);

		var cleaned_messages = messages.map(function(message) {
			return message.toClientObject();
		});

		res.send({"messages": cleaned_messages});
	});
};

exports.show = function(req, res) {
	models.Message.findOne({"_id": req.params.id}, function (err, message) {
		if (err) return res.send(400, err);
		if (!message) return res.send(404);

		res.send({"message": message.toClientObject()});
	});
};

exports.create = function(req, res) {
    async.concat(req.body, function(message_object, callback) {
        var message = new models.Message(message_object);
        callback(null, [message]);
    }, function (err, messages) {
        services.messages.createMany(messages, function(err, saved_messages) {
            if (err)
                res.send(400, err);
            else
                res.send({"messages": saved_messages});
        });
    });
};
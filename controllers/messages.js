var config = require('../config'),
    faye = require('faye'),
	models = require('../models'),
	_ = require('underscore');

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

		var cleaned_messages = _.map(messages, function(message) {
			return message.transformForClient();
		});

		res.send({"messages": cleaned_messages});
	});
};

exports.show = function(req, res) {
	models.Message.findOne({"_id": req.params.id}, function (err, message) {
		if (err) return res.send(400, err);
		if (!message) return res.send(404);

		res.send({"message": message.transformForClient()});
	});
};

exports.create = function(req, res) {
	var message = new models.Message(req.body);

	message.save(function(err, message) {
		if (err) return res.send(400, err);

		var client_message = message.transformForClient();

		console.log("created message: " + message.id + ": " + client_message);

		res.send({"message": client_message});
		global.bayeux.getClient().publish('/messages', client_message);
	});
};
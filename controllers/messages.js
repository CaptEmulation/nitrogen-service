var config = require('../config'),
    faye = require('faye'),
	models = require('../models');

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
	console.log("Message.create received " + req.body.length + " messages.");
	req.body.forEach(function(msg) {
		var message = new models.Message(msg);

		message.save(function(err, message) {
			if (err) return res.send(400, err);

			var client_message = message.toClientObject();

			console.log("created message: " + message.id + ": " + client_message);

			res.send({"message": client_message});
			global.bayeux.getClient().publish('/messages', client_message);
		});
	});
};
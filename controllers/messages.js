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

	var return_messages = [];
	var count = 0;

	req.body.forEach(function(msg) {
		var message = new models.Message(msg);

		if (!message.expires) {
			var defaultExpirationDate = new Date();
			defaultExpirationDate.setDate(new Date().getDate() + 30);

			message.expires = defaultExpirationDate;
		}

		// TODO: enforce from principal based on auth

		message.save(function(err, message) {
			count++;
			if (err) return res.send(400, err);

			var client_message = message.toClientObject();

			console.log("created message: " + message.id + ": " + JSON.stringify(client_message));

			return_messages.push(client_message);
			global.bayeux.getClient().publish('/messages', client_message);

			// are we finished?
			if (count == req.body.length) {
			    res.send({"messages": return_messages});
			}
		}.bind(this));

	}.bind(this));
};
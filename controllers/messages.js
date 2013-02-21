var Config = require('../config'),
    config = new Config(),
	Message = require("../models/message").Message,
	redis = require('redis'),
	_ = require('underscore');

var redisClient = redis.createClient(config.redis_port, config.redis_host);

exports.index = function(req, res) {
	Message.find(function (err, messages) {
		if (err) return res.send(400);

		var cleaned_messages = _.map(messages, function(message) { return message.transformForClient() });
		res.send({"messages": cleaned_messages});
	});
};

exports.show = function(req, res) {
	Message.findOne({"_id": req.params.id}, function (err, message) {
		if (err) return res.send(400, err);
		if (!message) return res.send(404);

		res.send({"message": message.transformForClient()});
	});
};

exports.create = function(req, res) {
	var message = new Message(req.body);

	message.save(function(err, obj) {
		if (err) return res.send(400, err);

		console.log("created message: " + message._id + ": " + message.transformForClient());

		res.send({"message": message.transformForClient()});
		redisClient.publish('messages', JSON.stringify(message.transformForClient()));
	});
};
var Message = require("../models/message").Message;

exports.findAll = function(req, res) {
	Message.find(function (err, messages) {
		if (!err) {
			res.send({"messages": messages});			
		} else {
			res.send(400);
		}
	});
};

exports.findById = function(req, res) {
	Message.findOne({"_id": req.params.id}, function (err, message) {
		if (err) return res.send(400, err);
		if (!message) return res.send(404);

		res.send({"message": message});
	});
};

exports.create = function(req, res) {
	var message = new Message(req.body);

	message.save(function(err, obj) {
		if (err) return res.send(400, err);
		console.log("created message: " + message._id + ": " + message);
		res.send({"message": message});
	});
};
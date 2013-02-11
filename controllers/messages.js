var Message = require("../models/message").Message;

exports.findAll = function(req, res) {
	Message.find(function (err, models) {
		if (!err) {
			res.send(models);			
		} else {
			res.send(400);
		}
	});
};

exports.findById = function(req, res) {
	Message.findOne({"_id": req.params.id}, function (err, message) {
		if (!err) {
			res.send(message);
		} else {
			console.log("message findById error: " + err);
			res.send(400);
		}
	});
};

exports.create = function(req, res) {
	var message = new Message(req.body);

	message.save(function(err, obj) {
		if (!err) {
			res.send(message);
		} else {
			console.log("message create error: " + err);
			res.send(400);
		}
	});
};
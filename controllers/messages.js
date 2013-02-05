var Message = require("../models/message").Message;

exports.findAll = function(req, res) {
	Message.find(function (err, models) {
		if (err) {
			console.log('error in Message.findAll: ' + err);
		} else {
			res.send(models);			
		}
	});
};

exports.findById = function(req, res) {
};

exports.create = function(req, res) {
	var message = new Message(req.body);

	message.save(function(err, obj) {
		if (err) {
			console.log("save of message failed");
		} else {
			res.send(message);
		}
	});
};
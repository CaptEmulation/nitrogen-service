var config = require('../config'),
	models = require('../models'),
	_ = require('underscore');

exports.create = function(req, res) {
	var device = new models.Principal(req.body);

	device.last_ip = req.ip;

	device.save(function(err, device) {
		if (err) {
			console.log('device create error: ' + err);
			return res.send(400, err);
		}	

		var device_json = device.toClientObject();

		res.send({"device": device_json});
		global.bayeux.getClient().publish('/devices', device_json);
	});
};

exports.index = function(req, res) {
	// TODO: paging
	var start = 0;
 	var limit = 200;

	models.Principal.find({}, null, {
		skip: start, 
		limit: limit,
	    sort:{ timestamp: -1 }
	}, function (err, devices) {
		if (err) return res.send(400);

		var devices_json = _.map(devices, function(device) {
			return device.toClientObject();
		});
		res.send({"devices": devices_json});
	});
};

exports.show = function(req, res) {
	models.Principal.findOne({"_id": req.params.id}, function (err, device) {
		if (err) return res.send(400, err);
		if (!device) return res.send(404);

		res.send({"device": device.toClientObject()});
	});
};
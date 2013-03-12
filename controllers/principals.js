var config = require('../config'),
	models = require('../models'),
	services = require('../services');

exports.create = function(req, res) {
	var principal = new models.Principal(req.body);
	principal.last_ip = req.ip;

	services.principals.create(principal, function(err, principal) {
		if (err)
			res.send(400, err);
		else
        	res.send({"principal": principal.toClientView()});
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

		var devices_json = devices.map(function(device) {
			return device.toClientView();
		});
		res.send({"principals": devices_json});
	});
};

exports.show = function(req, res) {
	models.Principal.findOne({"_id": req.params.id}, function (err, device) {
		if (err) return res.send(400, err);
		if (!device) return res.send(404);

		res.send({"principal": device.toClientView()});
	});
};
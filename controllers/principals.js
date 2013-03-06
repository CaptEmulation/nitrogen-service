var config = require('../config'),
	models = require('../models');

exports.create = function(req, res) {
	var principal = new models.Principal(req.body);

	principal.last_ip = req.ip;

	principal.save(function(err, principal) {
		if (err) {
			console.log('principal create error: ' + err);
			return res.send(400, err);
		}

		var principal_json = principal.toClientObject();

		console.log("created principal: " + JSON.stringify(principal_json));

		res.send({"principal": principal_json});
		global.bayeux.getClient().publish('/principals', principal_json);
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
			return device.toClientObject();
		});
		res.send({"principals": devices_json});
	});
};

exports.show = function(req, res) {
	models.Principal.findOne({"_id": req.params.id}, function (err, device) {
		if (err) return res.send(400, err);
		if (!device) return res.send(404);

		res.send({"principal": device.toClientObject()});
	});
};
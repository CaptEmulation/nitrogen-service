var config = require('../config'),
	models = require('../models'),
	_ = require('underscore');

exports.create = function(req, res) {
	_.each(req.body.logs, function(l) {
		var log = new models.Log(l);
		log.text = l.text;

		log.save(function(err, log) {
			if (err) return res.send(400, err);
		});
	});

	res.send(200);
};
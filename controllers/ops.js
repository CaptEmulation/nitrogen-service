var config = require('../config');

exports.health = function(req, res) {
	// TODO: add database checks.
	res.send({status: "ok"});
};
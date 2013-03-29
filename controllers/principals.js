var config = require('../config')
  ,	models = require('../models')
  , services = require('../services');

exports.authenticate = function(req, res) {
    services.principals.authenticate(req.body, function (err, principal, accessToken) {
        if (err) return res.send(401, err);

        res.send({ "principal": principal, "accessToken": accessToken });
    });
};

exports.create = function(req, res) {
	var principal = new models.Principal(req.body);
	principal.last_ip = req.ip;

	services.principals.create(principal, function(err, principal) {
		if (err) {
			res.send(400, err);
        } else {
            services.accessTokens.create(principal, function(err, accessToken) {
                if (err) res.send(400, err);

                res.send({ "principal": principal,
                           "accessToken": accessToken });

            });
        }
	});
};

exports.index = function(req, res) {

	// TODO: paging, move out to service
	var start = 0;
 	var limit = 200;

    services.principals.find({}, start, limit, { timestamp: -1 }, function (err, principals) {
		if (err) return res.send(400);

		res.send({"principals": principals});
	});
};

exports.show = function(req, res) {
	services.principals.findById(req.params.id, function (err, principal) {
		if (err) return res.send(400, err);
		if (!principal) return res.send(404);

		res.send({"principal": principal});
	});
};
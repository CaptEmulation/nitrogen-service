var config = require('../config')
  , models = require('../models')
  , services = require('../services')
  , utils = require('../utils');

var sendAuthResponse = function(res, principal, accessToken) {
    res.send({ 'principal': principal, 'accessToken': accessToken });
};

exports.authenticate = function(req, res) {
    services.principals.authenticate(req.body, function (err, principal, accessToken) {
        if (err) return res.send(400, err);

        services.principals.updateLastConnection(principal, utils.ipFromRequest(req));

        sendAuthResponse(res, principal, accessToken);
    });
};

exports.create = function(req, res) {
	var principal = new models.Principal(req.body);
	principal.last_ip = utils.ipFromRequest(req);

	services.principals.create(principal, function(err, principal) {
		if (err) return res.send(400, err);

        services.accessTokens.create(principal, function(err, accessToken) {
            if (err) res.send(400, err);

            var principalJSON = principal.toObject();

            if (principal.isDevice()) {
                // for create (and create only) we want to pass back the secret to the device.
                principalJSON.secret = principal.secret;
            }

            sendAuthResponse(res, principalJSON, accessToken);
        });
	});
};

exports.impersonate = function(req, res) {
    services.principals.impersonate(req.user, req.body.id, function (err, impersonatedPrincipal, accessToken) {
        if (err) return res.send(400, err);

        sendAuthResponse(res, impersonatedPrincipal, accessToken);
    });
};

exports.index = function(req, res) {
    var query = utils.parseQuery(req);
    var options = utils.parseOptions(req);

    if (!options.sort) options.sort = { last_connection: -1 };

    services.principals.find(req.user, query, options, function (err, principals) {
		if (err) return res.send(400, err);

		res.send({"principals": principals});
	});
};

exports.show = function(req, res) {
	services.principals.findById(req.user, req.params.id, function (err, principal) {
		if (err) return res.send(400, err);
		if (!principal) return res.send(404);

		res.send({"principal": principal});
	});
};
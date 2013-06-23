var config = require('../config')
  , log = require('../log')
  , models = require('../models')
  , services = require('../services')
  , utils = require('../utils');

var sendAuthResponse = function(res, principal, accessToken) {
    res.send({ 'principal': principal, 'accessToken': accessToken });
};

exports.authenticate = function(req, res) {
    services.principals.authenticate(req.body, function (err, principal, accessToken) {
        if (err) {
            log.error("authentication of principal failed: " + err);
            return res.send(401, { error: err });
        }

        // since the authenticateRequest middleware was not run on this request run it manually.
        services.principals.updateLastConnection(principal, utils.ipFromRequest(req));

        sendAuthResponse(res, principal, accessToken);
    });
};

exports.create = function(req, res) {
	var principal = new models.Principal(req.body);

	services.principals.create(principal, function(err, principal) {
		if (err) return res.send(400, { error: err });

        services.accessTokens.create(principal, function(err, accessToken) {
            if (err) return res.send(400, { error: err });

            var principalJSON = principal.toObject();

            if (principal.is('device')) {
                // for create (and create only) we want to pass back the secret to the device.
                principalJSON.secret = principal.secret;
            }

            // since the authenticateRequest middleware was not run on this request run it manually.
            services.principals.updateLastConnection(principal, utils.ipFromRequest(req));

            sendAuthResponse(res, principalJSON, accessToken);
        });
	});
};

exports.impersonate = function(req, res) {
    services.principals.impersonate(req.user, req.body.id, function (err, impersonatedPrincipal, accessToken) {
        if (err) return utils.handleError(res, err);

        sendAuthResponse(res, impersonatedPrincipal, accessToken);
    });
};

exports.index = function(req, res) {
    var query = utils.parseQuery(req);
    var options = utils.parseOptions(req);

    if (!options.sort) options.sort = { last_connection: -1 };

    services.principals.find(req.user, query, options, function (err, principals) {
        if (err) return utils.handleError(res, err);

		res.send({ principals: principals });
	});
};

exports.remove = function(req, res) {
    services.principals.removeById(req.user, req.params.id, function(err) {
        if (err) return utils.handleError(res, err);

        res.send(200);
    });
};

exports.show = function(req, res) {
	services.principals.findById(req.user, req.params.id, function (err, principal) {
		if (err) return utils.handleError(res, err);
		if (!principal) return utils.sendFailedResponse(res, 403, "Can't show requested principal.");

		res.send({ principal: principal });
	});
};

exports.update = function(req, res) {
    services.principals.update(req.user, req.params.id, req.body, function(err, principal) {
        if (err) return utils.handleError(res, err);

        res.send({ principal: principal });
    });
};
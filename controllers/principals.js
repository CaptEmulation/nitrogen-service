var config = require('../config')
  , log = require('../log')
  , models = require('../models')
  , services = require('../services')
  , utils = require('../utils');

var sendAuthResponse = function(res, principal, accessToken) {
    res.set('X-n2-set-access-token', JSON.stringify(accessToken));
    res.send({ principal: principal, accessToken: accessToken });
};

exports.authenticate = function(req, res) {
    services.principals.authenticate(req.body, function(err, principal, accessToken) {
        if (err) return utils.handleError(res, err);

        // since the authenticateRequest middleware was not run on this request run it manually.
        services.principals.updateLastConnection(principal, utils.ipFromRequest(req));

        sendAuthResponse(res, principal, accessToken);
    });
};

exports.changePassword = function(req, res) {

    // even though we have an accesstoken to validate this request, we still want the 
    // user to provide a password to reauthenticate such that we know it is them, and not a hijacked
    // browser window that is making the change password request.
    services.principals.authenticate(req.body, function(err, principal) {
        if (err) return utils.handleError(res, err);

        services.principals.changePassword(principal, req.body.new_password, function(err, principal, accessToken) {
            if (err) return utils.handleError(res, err);

            sendAuthResponse(res, principal.toObject(), accessToken);
        });
    });
};

exports.create = function(req, res) {
	var principal = new models.Principal(req.body);

	services.principals.create(principal, function(err, principal) {
		if (err) return utils.handleError(res, err);

        services.accessTokens.create(principal, function(err, accessToken) {
            if (err) return utils.handleError(res, err);

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

exports.resetPassword = function(req, res) {
    services.principals.find(services.principals.servicePrincipal, { email: req.params.email }, function(err, principals) {
        if (err) return utils.handleError(res, err);
        if (principals.length < 1) return utils.notFoundError(res);

        services.principals.resetPassword(services.principals.servicePrincipal, principals[0], function(err) {
            if (err) return utils.handleError(res, err);

            res.send(200);
        });
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
    if (req.body.visible_to) return utils.handleError(res, utils.badRequest("update of principal can't include visible_to"));

    services.principals.update(req.user, req.params.id, req.body, function(err, principal) {
        if (err) return utils.handleError(res, err);

        res.send({ principal: principal });
    });
};
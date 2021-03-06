var config = require('../config')
  , log = require('../log')
  , passport = require('passport')
  , services = require('../services')
  , utils = require('../utils');

var tokenNearExpirationCheck = function(req, res, callback) {
    var secondsToExpiration = req.user.jwtToken - (Date.now() / 1000);

    if (secondsToExpiration > config.refresh_token_threshold * config.access_token_lifetime * 24 * 60 * 60)
        return callback();

    services.accessTokens.create(req.user, function(err, accessToken) {
        if (err) return callback(err);

        res.set('X-n2-set-access-token', JSON.stringify(accessToken));

        callback();
    });
};

module.exports = function(req, res, next) {
    var auth = passport.authenticate(['bearer'], { session: false });
    req.pause();

    auth(req, res, function(err, failed) {
        if (err) {
            req.resume();
            return utils.handleError(res, utils.authenticationError());
        }

        tokenNearExpirationCheck(req, res, function(err) {
            req.resume();

            if (err) return res.send(utils.authenticationError(err));

            // opportunistically update the last connection details for this principal.
            if (req.user && req.ips) {
                services.principals.updateLastConnection(req.user, utils.ipFromRequest(req));
            }

            next();
        });
    });
};
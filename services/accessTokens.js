var config = require("../config")
  , crypto = require('crypto')
  , models = require("../models")
  , utils = require("../utils");

var create = function(principal, callback) {
    var accessToken = new models.AccessToken({
        expires_at: utils.dateDaysFromNow(config.access_token_lifetime),
        principal: principal
    });

    crypto.randomBytes(config.access_token_bytes, function(err, tokenBuf) {
        if (err) return callback(err);

        accessToken.token = tokenBuf.toString('base64');
        accessToken.save(callback);
    });
};

var find = function(query, options, callback) {
    models.AccessToken.find(query, null, options, callback);
};

var findByToken = function(token, callback) {
    models.AccessToken.findOne({"token": token}, callback).populate('principal');
};

var findOrCreateToken = function(principal, callback) {
    find({ "principal": principal.id }, { sort: { expires_at: -1 } }, function(err, tokens) {
        if (err) return callback(err);

        if (tokens && tokens.length > 0 && !isCloseToExpiration(tokens[0])) {
            return callback(null, tokens[0]);
        } else {
            create(principal, function(err, accessToken) {
                if (err) return callback(err);

                callback(null, accessToken);
            });
        }
    });
};

// an access token is close to expiration if less than 10% of its original life exists.
var isCloseToExpiration = function(accessToken) {
    return accessToken.secondsToExpiration() < config.refresh_token_threshold * config.access_token_lifetime * 24 * 60 * 60;
};

var remove = function(query, callback) {
    models.AccessToken.remove(query, callback);
};

var verify = function(token, done) {
    findByToken(token, function(err, accessToken) {
        if (err) return done(err);
        if (!accessToken || accessToken.expired()) { return done("Session has expired.", false); }

        var principal = accessToken.principal;
        principal.accessToken = accessToken;

        done(null, principal);
    });
};

module.exports = {
    create: create,
    findByToken: findByToken,
    findOrCreateToken: findOrCreateToken,
    isCloseToExpiration: isCloseToExpiration,
    remove: remove,
    verify: verify
};
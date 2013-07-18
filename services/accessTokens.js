var config = require("../config")
  , crypto = require('crypto')
  , models = require("../models")
  , utils = require("../utils");

var create = function(principal, callback) {
    var accessToken = new models.AccessToken();
    accessToken.principal = principal;
    accessToken.expires_at = utils.dateDaysFromNow(config.access_token_lifetime);

    crypto.randomBytes(config.access_token_bytes, function(err, tokenBuf) {
        if (err) return callback(err);

        accessToken.token = tokenBuf.toString('base64');
        accessToken.save(callback);
    });
};

var findOrCreateToken = function(principal, callback) {
    models.AccessToken.find({ "principal": principal.id }, null, {sort: { expires_at: -1 } }, function(err, tokens) {
        if (err) return callback(err);

        if (tokens && tokens.length > 0 && !tokens[0].expired()) {
            return callback(null, tokens[0]);
        } else {
            create(principal, function(err, accessToken) {
                if (err) return callback(err);

                callback(null, accessToken);
            });
        }
    }).populate('principal');
};

var findByToken = function(token, callback) {
    models.AccessToken.findOne({"token": token}, callback).populate('principal');
};

var verify = function(token, done) {
    findByToken(token, function(err, accessToken) {
        if (err) { return done(err); }
        if (!accessToken || accessToken.expired()) { return done("Your session has expired.", false); }

        done(null, accessToken.principal);
    });
};

module.exports = {
    create: create,
    findByToken: findByToken,
    findOrCreateToken: findOrCreateToken,
    verify: verify
};
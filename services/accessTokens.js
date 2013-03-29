var config = require("../config")
  , crypto = require('crypto')
  , models = require("../models")
  , utils = require("../utils");

var create = function(principal, callback) {
    var accessToken = new models.AccessToken();
    accessToken.principal_id = principal.id;

    // TODO: factor this out into some sort of util function.
    accessToken.expires_at = new Date();
    accessToken.expires_at.setDate(new Date().getDate() + 30);

    crypto.randomBytes(config.access_token_bytes, function(err, tokenBuf) {
        if (err) return callback(err);

        console.log("creating access token for principal id: " + accessToken.principal_id +
            " with expiration: " + accessToken.expires_at);

        accessToken.token = tokenBuf.toString('base64');
        accessToken.save(callback);
    });
};

var findOrCreateToken = function(principal, callback) {
    models.AccessToken.find({"principal_id": principal.id}, null, {sort: { expires_at: -1 } }, function(err, tokens) {
        if (err) return callback(err);

        if (tokens && tokens.length > 0 && !tokens[0].expired()) {
            return callback(null, tokens[0]);
        } else {
            create(principal, function(err, accessToken) {
                if (err) return callback(err);

                callback(null, accessToken);
            });
        }
    });
};

var findById = function(token, callback) {
    models.AccessToken.findOne({"token": token}, callback);
};

var verify = function(token, done) {
    findById(token, function(err, accessToken) {
        if (err) { return done(err); }
        if (!accessToken || accessToken.expired()) { return done(null, false); }

        return done(null, accessToken.principal);
    });
};

module.exports = {
    create: create,
    findById: findById,
    findOrCreateToken: findOrCreateToken,
    verify: verify
};
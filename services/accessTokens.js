var models = require("../models"),
    utils = require("../utils");

var create = function(principal, callback) {
    var accessToken = new models.AccessToken();
    accessToken.principal_id = principal.id;

    accessToken.expires_at = new Date();
    accessToken.expires_at.setDate(new Date().getDate() + 30);

    accessToken.token = utils.uid(64);

    accessToken.save(callback);
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
    verify: verify
};


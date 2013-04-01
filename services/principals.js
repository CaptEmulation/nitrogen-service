var async = require("async")
  , config = require('../config')
  , crypto = require("crypto")
  , models = require("../models")
  , services = require("../services");

var authenticate = function(authBody, callback) {
    if (authBody.email && authBody.password) {
        authenticateUser(authBody.email, authBody.password, callback);
    } else if (authBody.id && authBody.secret) {
        authenticateDevice(authBody.id, authBody.secret, callback);
    } else {
        callback("Request body did not follow expected format.");
    }
};

var authenticateUser = function(email, password, callback) {
    findByEmail(email, function(err, principal) {
        if (err) return callback(err);
        if (!principal) return callback(404);

        verifyPassword(password, principal, function(err) {
            if (err) return callback(err, null);

            services.accessTokens.findOrCreateToken(principal, function(err, accessToken) {
                if (err) return callback(err, null);

                callback(null, principal, accessToken);
            });
        });
    });
};

var authenticateDevice = function(principalId, secret, callback) {
    findById(principalId, function(err, principal) {
        if (err) return callback(err, null);
        if (!principal) return callback(404, null);

        verifySecret(secret, principal, function(err) {
            if (err) return callback(err, null);

            services.accessTokens.findOrCreateToken(principal, function(err, accessToken) {
                if (err) return callback(err, null);

                callback(null, principal, accessToken);
            });
        });
    });
};

var create = function(principal, callback) {

    createCredentials(principal, function(err, principal) {

        principal.save(function(err, principal) {
            if (err) return callback(err, null);

            var principal_json = JSON.stringify(principal);
            global.bayeux.getClient().publish('/principals', principal_json);

            callback(null, principal);
        });
    });
};

var createCredentials = function(principal, callback) {
    if (principal.isUser()) {
        createUserCredentials(principal, callback);
    } else {
        createDeviceCredentials(principal, callback);
    }
};

var createDeviceCredentials = function(principal, callback) {
    crypto.randomBytes(config.device_secret_bytes, function(err, secretBuf) {
        if (err) return callback(err, null);

        principal.secret = secretBuf.toString('base64');

        hashSecret(principal.secret, function(err, hashedSecret) {
            if (err) return callback(err, null);

            principal.secret_hash = hashedSecret;
            callback(null, principal);
        });
    });
};

var createUserCredentials = function(principal, callback) {
    crypto.randomBytes(config.salt_length_bytes, function(err, saltBuf) {
        hashPassword(principal.password, saltBuf, function(err, hashedPasswordBuf) {
            if (err) return callback(err, null);

            principal.salt = saltBuf.toString('base64');
            principal.password_hash = hashedPasswordBuf.toString('base64');
            callback(null, principal);
        });
    });
};

var find = function(filter, start, limit, sort, callback) {
    models.Principal.find(filter, null, {
        skip: start,
        limit: limit,
        sort: sort
    }, callback);
};

var findByEmail = function(email, callback) {
    models.Principal.findOne({"email": email}, callback);
};

var findById = function(id, callback) {
    models.Principal.findOne({"_id": id}, callback);
};

var hashSecret = function(secret, callback) {
    // have to create a buffer here because node's sha256 hash function expects binary encoding.
    var secretBuf = new Buffer(secret, 'base64');

    var sha256 = crypto.createHash('sha256');
    sha256.update(secretBuf.toString('binary'), 'binary');

    callback(null, sha256.digest('base64'));
};

var verifySecret = function(secret, principal, callback) {
    hashSecret(secret, function(err, hashedSecret) {
        if (err) return callback(err);
        if (hashedSecret != principal.secret_hash) {
            console.log("verification of secret for principal: " + principal.id + " failed");
            return callback(401);
        }

        callback(null);
    });
};

var hashPassword = function(password, saltBuf, callback) {
    crypto.pbkdf2(password, saltBuf,
                  config.password_hash_iterations, config.password_hash_length,
                  function(err, hash) {
        if (err) return callback(err, null);

        var hashBuf = new Buffer(hash, 'binary');
        callback(null, hashBuf);
    });
};

var verifyPassword = function(password, user, callback) {
    var saltBuf = new Buffer(user.salt, 'base64');

    hashPassword(password, saltBuf, function(err, hashedPasswordBuf) {
        if (err) return callback(err);
        if (user.password_hash != hashedPasswordBuf.toString('base64')) return callback(401);

        callback(null);
    });
};

module.exports = {
    authenticate: authenticate,
    create: create,
    find: find,
    findById: findById,
    verifySecret: verifySecret,
    verifyPassword: verifyPassword
};
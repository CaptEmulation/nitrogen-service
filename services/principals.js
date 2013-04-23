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
        if (!principal) return callback(401);

        verifyPassword(password, principal, function(err) {
            if (err) return callback(err);

            services.accessTokens.findOrCreateToken(principal, function(err, accessToken) {
                if (err) return callback(err);

                console.log("authenticated user principal: " + principal.id);
                callback(null, principal, accessToken);
            });
        });
    });
};

var authenticateDevice = function(principalId, secret, callback) {
    findById(principalId, function(err, principal) {
        if (err) return callback(err);
        if (!principal) return callback(401);

        verifySecret(secret, principal, function(err) {
            if (err) return callback(err);

            services.accessTokens.findOrCreateToken(principal, function(err, accessToken) {
                if (err) return callback(err);

                console.log("authenticated device principal: " + principal.id);
                callback(null, principal, accessToken);
            });
        });
    });
};

var create = function(principal, callback) {
    checkForExistingPrincipal(principal, function(err, foundPrincipal) {
        if (err) return callback(err);
        if (foundPrincipal) return callback("Principal already exists");

        createCredentials(principal, function(err, principal) {
            if (err) return callback(err);

            principal.save(function(err, principal) {
                if (err) return callback(err);

                console.log("created " + principal.principal_type + " principal: " + principal.id);
                var principal_json = JSON.stringify(principal);

                services.realtime.publish('/principals', principal_json);

                callback(null, principal);
            });
        });
    });
};

var checkForExistingPrincipal = function(principal, callback) {
    if (principal.isUser()) {
        findByEmail(principal.email, callback);
    } else {
        findById(principal.id, callback);
    }
};

var createCredentials = function(principal, callback) {
    if (principal.isUser()) {
        if (!principal.email) return callback("user principal must have email");
        if (!principal.password) return callback("user principal must have password");

        createUserCredentials(principal, callback);
    } else {
        createSecretCredentials(principal, callback);
    }
};

var createSecretCredentials = function(principal, callback) {
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

var find = function(filter, options, callback) {
    models.Principal.find(filter, null, options, callback);
};

var findByEmail = function(email, callback) {
    models.Principal.findOne({"email": email}, callback);
};

var findById = function(id, callback) {
    models.Principal.findOne({"_id": id}, callback);
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


var hashSecret = function(secret, callback) {
    // have to create a buffer here because node's sha256 hash function expects binary encoding.
    var secretBuf = new Buffer(secret, 'base64');

    var sha256 = crypto.createHash('sha256');
    sha256.update(secretBuf.toString('binary'), 'binary');

    callback(null, sha256.digest('base64'));
};

var impersonate = function(principal, impersonatedPrincipalId, callback) {
    if (principal.principal_type != "system" && principal.id != impersonatedPrincipalId) return callback(401);

    findById(impersonatedPrincipalId, function(err, impersonatedPrincipal) {
        if (err) return callback(err, null);
        if (!impersonatedPrincipal) return callback(404, null);

        services.accessTokens.findOrCreateToken(impersonatedPrincipal, function(err, accessToken) {
            if (err) return callback(err, null);

            console.log("impersonated device principal: " + impersonatedPrincipal.id);
            callback(null, impersonatedPrincipal, accessToken);
        });
    });
};

var initialize = function(callback) {

    console.log("searching for system principal");
    find({ principal_type: "system" }, {}, function(err, principals) {
        if (err) return callback(err);

        console.log("found " + principals.length + " system principals");

        if (principals.length == 0) {
            console.log("creating system principal");
            var systemPrincipal = new models.Principal({ principal_type: "system" });
            create(systemPrincipal, function(err, systemPrincipal) {
                console.log("system principal created: " + err);
                services.principals.systemPrincipal = systemPrincipal;
                return callback(err);
            });
        } else {
            services.principals.systemPrincipal = principals[0];
            return callback();
        }
    });
};

var update = function(principal, callback) {
    principal.save(callback);
};

var updateLastConnection = function(principal, ip) {

    // emit a ip message each time ip changes for principal.
    if (principal.last_ip != ip) {
        principal.last_ip = ip;

        var ipMessage = new models.Message({ "message_type": "ip" });
        ipMessage.from = principal;
        ipMessage.body.ip_address = ip;

        services.messages.create(ipMessage, function(err, message) {
            if (err) console.log("creating ip message failed: " + err);
        });
    }

    principal.last_connection = new Date();

    services.principals.update(principal);
}

var verifyPassword = function(password, user, callback) {
    var saltBuf = new Buffer(user.salt, 'base64');

    hashPassword(password, saltBuf, function(err, hashedPasswordBuf) {
        if (err) return callback(err);
        if (user.password_hash != hashedPasswordBuf.toString('base64')) return callback(401);

        callback(null);
    });
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

module.exports = {
    authenticate: authenticate,
    create: create,
    find: find,
    findById: findById,
    impersonate: impersonate,
    initialize: initialize,
    update: update,
    updateLastConnection: updateLastConnection,
    verifySecret: verifySecret,
    verifyPassword: verifyPassword,

    systemPrincipal: null
};
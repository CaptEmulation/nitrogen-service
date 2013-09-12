var async = require('async')
  , config = require('../config')
  , crypto = require('crypto')
  , log = require('../log')
  , models = require('../models')
  , mongoose = require('mongoose')
  , services = require('../services')
  , utils = require('../utils');

var DEVICE_AUTH_FAILURE_MESSAGE = "The device authentication details provided were not accepted.";
var USER_AUTH_FAILURE_MESSAGE = "The email or password provided were not found or incorrect.";

var authenticationError = function(msg) {
    return new utils.ServiceError({
        statusCode: 401,
        message: msg
    });
};

var authenticate = function(authBody, callback) {
    if (authBody.email && authBody.password) {
        authenticateUser(authBody.email, authBody.password, callback);
    } else if (authBody.id && authBody.secret) {
        authenticateDevice(authBody.id, authBody.secret, callback);
    } else {
        callback("Please sign in with your email and password.");
    }
};

var authenticateUser = function(email, password, callback) {
    findByEmail(services.principals.systemPrincipal, email, function(err, principal) {
        if (err) return callback(err);
        if (!principal) return callback(authenticationError(USER_AUTH_FAILURE_MESSAGE));

        log.info("found user email: " + email + " verifying password.");
        verifyPassword(password, principal, function(err) {
            if (err) return callback(err);

            log.info("verified password, creating access token.");
            services.accessTokens.findOrCreateToken(principal, function(err, accessToken) {
                if (err) return callback(err);

                log.info("authenticated user principal: " + principal.id);
                callback(null, principal, accessToken);
            });
        });
    });
};

var authenticateDevice = function(principalId, secret, callback) {
    findById(services.principals.systemPrincipal, principalId, function(err, principal) {
        if (err) return callback(err);
        if (!principal) return callback(new utils.ServiceError({
            statusCode: 401,
            message: DEVICE_AUTH_FAILURE_MESSAGE
        }));

        verifySecret(secret, principal, function(err) {
            if (err) return callback(err);

            services.accessTokens.findOrCreateToken(principal, function(err, accessToken) {
                if (err) return callback(err);

                log.info("authenticated device principal: " + principal.id);
                callback(null, principal, accessToken);
            });
        });
    });
};

var create = function(principal, callback) {
    validate(principal, function(err) {
        if (err) return callback(err);

        checkForExistingPrincipal(principal, function(err, foundPrincipal) {
            if (err) return callback(err);
            if (foundPrincipal) return callback("A user with that email already exists.  Please sign in with your email and password.");

            createCredentials(principal, function(err, principal) {
                if (err) return callback(err);

                if (principal.is('user') || principal.is('system')) {
                    principal.id = new mongoose.Types.ObjectId;
                    principal.owner = principal.id;
                }

                principal.save(function(err, principal) {
                    if (err) return callback(err);

                    log.info("created " + principal.type + " principal: " + principal.id);
                    notifySubscriptions(principal, function(err) {
                        return callback(err, principal);
                    });
                });
            });
        });
    });
};

var checkForExistingPrincipal = function(principal, callback) {
    if (!services.principals.systemPrincipal) {
        log.error('principal service: not able to check for existing user because no system principal.');
        return callback(null, null);
    }

    if (principal.is('user')) {
        findByEmail(services.principals.systemPrincipal, principal.email, callback);
    } else {
        findById(services.principals.systemPrincipal, principal.id, callback);
    }
};

var createCredentials = function(principal, callback) {
    if (principal.is('user')) {
        createUserCredentials(principal, callback);
    } else {
        createSecretCredentials(principal, callback);
    }
};

var createSecretCredentials = function(principal, callback) {
    if (!config.device_secret_bytes) return callback("Service is missing configuration.  Please add value for missing device_secret_bytes element.");

    crypto.randomBytes(config.device_secret_bytes, function(err, secretBuf) {
        if (err) return callback(err);

        principal.secret = secretBuf.toString('base64');
        issueClaimCode(principal, function(err, code) {
            if (err) return callback(err);
            principal.claim_code = code;

            hashSecret(principal.secret, function(err, hashedSecret) {
                if (err) return callback(err);

                principal.secret_hash = hashedSecret;
                callback(null, principal);
            });
        });
    });
};

var createUserCredentials = function(principal, callback) {
    crypto.randomBytes(config.salt_length_bytes, function(err, saltBuf) {
        if (err) return callback(err);

        hashPassword(principal.password, saltBuf, function(err, hashedPasswordBuf) {
            if (err) return callback(err);

            principal.salt = saltBuf.toString('base64');
            principal.password_hash = hashedPasswordBuf.toString('base64');

            callback(null, principal);
        });
    });
};

var filterForPrincipal = function(principal, filter) {
    if (principal && principal.is('system')) return filter;

    var visibilityFilter = [{ public: true }];
    if (principal) {
        visibilityFilter.push({ owner: principal._id });
        visibilityFilter.push({ "_id": principal._id });
    }

    return { $and: [ filter, { $or: visibilityFilter } ] };
};

var find = function(principal, filter, options, callback) {
    models.Principal.find(filterForPrincipal(principal, filter), null, options, callback);
};

var findByEmail = function(principal, email, callback) {
    models.Principal.findOne(filterForPrincipal(principal, { "email": email }), callback);
};

var findById = function(principal, id, callback) {
    models.Principal.findOne(filterForPrincipal(principal, { "_id": id }), callback);
}

var checkClaimCode = function(code, callback) {
    find(services.principals.systemPrincipal, { claim_code: code }, {}, function (err, principals) {
        if (err) return callback(true);
        callback(principals.length > 0);  
    });
};

var generateClaimCode = function() {
    var code = '';
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (var i=0; i < config.claim_code_length / 2; i++) {
        var idx = Math.floor(Math.random() * characters.length);
        code += characters[idx]; 
    }

    code += '-';

    for (var i=0; i < config.claim_code_length / 2; i++) {
        code += Math.floor(Math.random() * 10);    
    }

    return code;
};

var issueClaimCode = function(principal, callback) {
    if (!principal.is('device')) return callback(null,null); 

    var wasCollision = true;
    var claimCode = null;
    async.whilst(
        function() { return wasCollision; },
        function(callback) {
            claimCode = generateClaimCode();
            checkClaimCode(claimCode, function(collision) {
                wasCollision = collision;
                callback();
            });
        },           
        function(err) {
           if (err) return callback(err); 
           callback(null, claimCode);
        }
    );

};

var hashPassword = function(password, saltBuf, callback) {
    crypto.pbkdf2(password,
                  saltBuf,
                  config.password_hash_iterations,
                  config.password_hash_length,
                  function(err, hash) {
                      if (err) return callback(err);

 
                      var hashBuf = new Buffer(hash, 'binary');
                      callback(null, hashBuf);
                  }
    );
};

var hashSecret = function(secret, callback) {
    // have to create a buffer here because node's sha256 hash function expects binary encoding.
    var secretBuf = new Buffer(secret, 'base64');

    var sha256 = crypto.createHash('sha256');
    sha256.update(secretBuf.toString('binary'), 'binary');

    callback(null, sha256.digest('base64'));
};

var impersonate = function(principal, impersonatedPrincipalId, callback) {
    if (principal.type != "system" && principal.id != impersonatedPrincipalId) return callback(utils.authorizationError());

    findById(services.principals.systemPrincipal, impersonatedPrincipalId, function(err, impersonatedPrincipal) {
        if (err) return callback(err);
        if (!impersonatedPrincipal) return callback(utils.notFoundError());

        services.accessTokens.findOrCreateToken(impersonatedPrincipal, function(err, accessToken) {
            if (err) return callback(err);

            log.info("impersonated device principal: " + impersonatedPrincipal.id);
            callback(null, impersonatedPrincipal, accessToken);
        });
    });
};

var initialize = function(callback) {

    // we don't use services find() here because it is a chicken and an egg visibility problem.
    // we aren't system so we can't find system. :)

    models.Principal.find({ type: "system" }, null, {}, function(err, principals) {
        if (err) return callback(err);

        log.info("found " + principals.length + " system principals");

        if (principals.length == 0) {
            log.info("creating system principal");

            var systemPrincipal = new models.Principal({
                name: 'System',
                public: false,
                type: 'system'
            });

            create(systemPrincipal, function(err, systemPrincipal) {
                if (err) return callback(err);

                services.principals.systemPrincipal = systemPrincipal;
                return callback();
            });
        } else {
            services.principals.systemPrincipal = principals[0];
            return callback();
        }
    });
};

var notifySubscriptions = function(principal, callback) {
    services.subscriptions.publish('principal', principal, callback);
};

var removeById = function(authorizingPrincipal, id, callback) {
    findById(authorizingPrincipal, id, function (err, principal) {
        if (err) return callback(err);
        if (!authorizingPrincipal.id === principal.id && !authorizingPrincipal.id === principal &&
            !authorizingPrincipal.id !== services.principals.systemPrincipal.id) return callback(new utils.ServiceError({
            statusCode: 400,
            message: "Principal.removeById: Principal not authorized to make change."
        }));

        services.messages.remove(services.principals.systemPrincipal, { from: principal.id }, function(err, removed) {
            if (err) return callback(err);

            models.Principal.remove({ _id: id }, callback);
        });
    });
};

var update = function(authorizingPrincipal, id, updates, callback) {
    if (!authorizingPrincipal) return callback(new utils.ServiceError({
        statusCode: 400,
        message: "Principal.update: Missing required argument authorizingPrincipal."
    }));

    if (!id) return callback(new utils.ServiceError({
        statusCode: 400,
        message: "Principal.update: Missing required argument id."
    }));

    findById(authorizingPrincipal, id, function(err, principal) {
        if (err) return callback(err);
        if (!principal) return callback(new utils.ServiceError({
            statusCode: 400,
            message: "Principal.update: Can't find authorizing principal."
        }));
        if (!authorizingPrincipal.is('system') && authorizingPrincipal.id != principal.id && authorizingPrincipal.id != principal.owner) {
            return callback(new utils.ServiceError({
                statusCode: 400,
                message: "Principal.update: Principal not authorized to make change."
            }));
        }

        // if its not the system, you can only update the name.
        if (!authorizingPrincipal.is('system')) {
            updates = { name: updates.name };
        }

        models.Principal.update({ _id: id }, { $set: updates }, function (err, updateCount) {
            if (err) return callback(err);

            findById(authorizingPrincipal, id, function(err, updatedPrincipal) {
                if (err) return callback(err);

                notifySubscriptions(updatedPrincipal, function(err) {
                    return callback(err, updatedPrincipal);
                });
            });
        });
    });
};

var updateLastConnection = function(principal, ip) {
    var updates = {};

    // emit a ip message each time ip changes for principal.
    if (principal.last_ip != ip) {
        principal.last_ip = updates.last_ip = ip;

        var ipMessage = new models.Message({
            type: 'ip',
            from: principal,
            public: false,
            to: services.principals.systemPrincipal.id,
            body: {
                ip_address: ip
            }
        });

        services.messages.create(ipMessage, function(err, message) {
            if (err) log.info("creating ip message failed: " + err);
        });
    }

    principal.last_connection = updates.last_connection = new Date();

    update(services.principals.systemPrincipal, principal.id, updates, function(err, principal) {
        if (err) return log.error("updating last connection failed: " + err);
    });
};

var validate = function(principal, callback) {
    if (!principal.is('device') && !principal.is('user') && !principal.is('system')) {
        var err = 'Principal type must be one of device, user, or system. found: ' + principal.type;
        log.error(err);
        return callback(err);
    }

    if (principal.is('user')) {
        if (!principal.email) return callback("user principal must have email");
        if (!principal.password) return callback("user principal must have password");        
    }

    callback(null);
};

var verifyPassword = function(password, user, callback) {
    var saltBuf = new Buffer(user.salt, 'base64');

    hashPassword(password, saltBuf, function(err, hashedPasswordBuf) {
        if (err) return callback(err);
        if (user.password_hash != hashedPasswordBuf.toString('base64'))
            return callback(authenticationError(USER_AUTH_FAILURE_MESSAGE));
        else
            return callback(null);
    });
};

var verifySecret = function(secret, principal, callback) {
    hashSecret(secret, function(err, hashedSecret) {
        if (err) return callback(err);
        if (hashedSecret != principal.secret_hash) {
            log.info("verification of secret for principal: " + principal.id + " failed");
            return callback(authenticationError(DEVICE_AUTH_FAILURE_MESSAGE));
        }

        callback(null);
    });
};

module.exports = {
    authenticate: authenticate,
    create: create,
    find: find,
    findById: findById,
    generateClaimCode: generateClaimCode,
    impersonate: impersonate,
    initialize: initialize,
    removeById: removeById,
    update: update,
    updateLastConnection: updateLastConnection,
    verifySecret: verifySecret,
    verifyPassword: verifyPassword,

    systemPrincipal: null
};

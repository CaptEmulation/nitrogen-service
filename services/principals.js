var async = require('async')
  , config = require('../config')
  , crypto = require('crypto')
  , log = require('../log')
  , models = require('../models')
  , mongoose = require('mongoose')
  , nitrogen = require('nitrogen')
  , services = require('../services')
  , utils = require('../utils');

var DEVICE_AUTH_FAILURE_MESSAGE = "The device authentication details provided were not accepted.";
var USER_AUTH_FAILURE_MESSAGE = "The email or password provided were not accepted.";

var authenticate = function(authBody, callback) {
    if (authBody.email && authBody.password) {
        authenticateUser(authBody.email, authBody.password, callback);
    } else if (authBody.id && authBody.secret) {
        authenticateDevice(authBody.id, authBody.secret, callback);
    } else {
        callback(utils.authenticationError('Please sign in with your email and password.'));
    }
};

var authenticateUser = function(email, password, callback) {
    findByEmail(services.principals.servicePrincipal, email, function(err, principal) {
        if (err) return callback(err);
        if (!principal) return callback(utils.authenticationError(USER_AUTH_FAILURE_MESSAGE));

        log.info("found user email: " + email + " verifying password.");
        verifyPassword(password, principal, function(err) {
            if (err) return callback(err);

            log.info("verified password, fetching access token.");
            services.accessTokens.findOrCreateToken(principal, function(err, accessToken) {
                if (err) return callback(err);

                log.info("authenticated user principal: " + principal.id);
                callback(null, principal, accessToken);
            });
        });
    });
};

var authenticateDevice = function(principalId, secret, callback) {
    findById(services.principals.servicePrincipal, principalId, function(err, principal) {
        if (err) return callback(err);
        if (!principal) return callback(utils.authenticationError(DEVICE_AUTH_FAILURE_MESSAGE));

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

var changePassword = function(principal, newPassword, callback) {
    principal.password = newPassword;
    createUserCredentials(principal, function(err, principal) {
        if (err) return callback(err);

        // changing a user's password always invalidates all current access tokens.
        services.accessTokens.removeByPrincipal(principal, function(err) {
            if (err) return callback(err);

            // but create a new token for this user and return it in the callback.
            services.accessTokens.findOrCreateToken(principal, function(err, accessToken) {

                update(services.principals.servicePrincipal, principal.id, {
                    salt: principal.salt, 
                    password_hash: principal.password_hash
                }, function(err, principal) {
                    return callback(err, principal, accessToken);
                });
            });
        }); 
    });
};

var create = function(principal, callback) {
    validate(principal, function(err) {
        if (err) return callback(err);

        checkForExistingPrincipal(principal, function(err, foundPrincipal) {
            if (err) return callback(err);
            if (foundPrincipal) return callback(utils.badRequestError('A user with that email already exists.  Please sign in with your email and password.'));

            createCredentials(principal, function(err, principal) {
                if (err) return callback(err);

                principal.save(function(err, principal) {
                    if (err) return callback(err);

                    // TODO: yuck.  createPermissions needs servicePrincipal so we need to hotwire this here and now.
                    if (principal.is('service')) {
                        services.principals.servicePrincipal = principal;
                    }

                    createPermissions(principal, function(err) {
                        if (err) return callback(err);

                        log.info("created " + principal.type + " principal: " + principal.id);

                        findById(services.principals.servicePrincipal, principal.id, function(err, updatedPrincipal) {
                            if (!principal.is('user'))
                                updatedPrincipal.secret = principal.secret;

                            return callback(err, updatedPrincipal);
                        });
                    });
                });
            });
        });
    });
};

var checkForExistingPrincipal = function(principal, callback) {
    if (!services.principals.servicePrincipal) {
        log.info('principal service: not able to check for existing user because no service principal.');
        return callback(null, null);
    }

    if (principal.is('user')) {
        findByEmail(services.principals.servicePrincipal, principal.email, callback);
    } else {
        findById(services.principals.servicePrincipal, principal.id, callback);
    }
};

var createCredentials = function(principal, callback) {
    if (principal.is('user')) {
        createUserCredentials(principal, callback);
    } else {
        createSecretCredentials(principal, callback);
    }
};

var createPermissions = function(principal, callback) {
    var permission;

    if (principal.is('service')) {
        // service is authorized to do everything.
        permission = new models.Permission({
            authorized: true, 
            issued_to: services.principals.servicePrincipal.id, 
            priority: 0 
        });
    } else {
        permission = new models.Permission({
            authorized: true,
            issued_to: principal.id,
            principal_for: principal.id,
            priority: nitrogen.Permission.NORMAL_PRIORITY
        });                        
    }

    services.permissions.create(services.principals.servicePrincipal, permission, callback);
};

var createSecretCredentials = function(principal, callback) {
    if (!config.device_secret_bytes) return callback(
        utils.internalError('principals service: Service is missing required configuration item device_secret_bytes.')
    );

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
    if (principal && principal.is('service')) return filter;

    var visibilityClauses = [ { public: true } ];
    if (principal) {
        visibilityClauses.push({ visible_to: principal._id });
    }

    // only do more complex filter check if there is a filter.
    if (filter && Object.keys(filter).length > 0)
        return { $and: [ filter, { $or: visibilityClauses } ] };
    else
        return { $or: visibilityClauses };
};

var find = function(principal, filter, options, callback) {
    models.Principal.find(filterForPrincipal(principal, filter), null, options, callback);
};

var findByEmail = function(principal, email, callback) {
    models.Principal.findOne(filterForPrincipal(principal, { "email": email }), callback);
};

var findById = function(principal, id, callback) {
    models.Principal.findOne(filterForPrincipal(principal, { "_id": id }), callback);
};

var checkClaimCode = function(code, callback) {
    find(services.principals.servicePrincipal, { claim_code: code }, {}, function (err, principals) {
        if (err) return callback(true);
        callback(principals.length > 0);  
    });
};

var generateClaimCode = function() {
    var characterCode = '';
    var numberCode = '';

    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (var i=0; i < config.claim_code_length / 2; i++) {
        var idx = Math.floor(Math.random() * characters.length);
        characterCode += characters[idx];
        numberCode += Math.floor(Math.random() * 10); 
    }

    return characterCode + '-' + numberCode;
};

var issueClaimCode = function(principal, callback) {
    if (principal.is('user')) return callback(null,null); 

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
    if (!principal.is('service') && principal.id !== impersonatedPrincipalId) return callback(utils.authorizationError());

    findById(services.principals.servicePrincipal, impersonatedPrincipalId, function(err, impersonatedPrincipal) {
        if (err) return callback(err);
        if (!impersonatedPrincipal) return callback(utils.notFoundError());

        services.accessTokens.findOrCreateToken(impersonatedPrincipal, function(err, accessToken) {
            if (err) return callback(err);

            log.info("principal service: principal " + principal.id + " impersonated principal: " + impersonatedPrincipal.id);
            callback(null, impersonatedPrincipal, accessToken);
        });
    });
};

var initialize = function(callback) {

    // we don't use services find() here because it is a chicken and an egg visibility problem.
    // we aren't service so we can't find service. :)

    models.Principal.find({ type: 'service' }, null, {}, function(err, principals) {
        if (err) return callback(err);

        log.info("principals service: found " + principals.length + " service principals");

        if (principals.length === 0) {
            log.info("creating service principal");

            var servicePrincipal = new models.Principal({
                name: 'Service',
                public: true,
                type: 'service'
            });

            create(servicePrincipal, function(err, servicePrincipal) {
                if (err) return callback(err);

                services.principals.servicePrincipal = servicePrincipal;
                return callback();
            });
        } else {
            services.principals.servicePrincipal = principals[0];
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
        services.permissions.authorize({
            principal: authorizingPrincipal,
            principal_for: principal, 
            action: 'admin'
        }, principal, function(err, permission) {
             if (err) return callback(err);
             if (!permission.authorized) return callback(utils.authorizationError(permission));

             services.messages.remove(services.principals.servicePrincipal, { from: principal.id }, function(err, removed) {
                 if (err) return callback(err);
 
                 models.Principal.remove({ _id: id }, callback);
             });
         });
    });
};

var resetPassword = function(authorizingPrincipal, principal, callback) {
    services.permissions.authorize({
            principal: authorizingPrincipal,
            principal_for: principal,
            action: 'admin'
        }, principal, function(err, permission) {
            if (err) return callback(err);
            if (!permission.authorized) return callback(utils.authorizationError(permission));

            log.info('principals service: reseting password for principal: ' + principal.id + ': ' + principal.email);

            generateRandomPassword(function(err, randomPassword) {
                if (err) return callback(err);

                changePassword(principal, randomPassword, function(err, principal) {
                    if (err) return callback(err);

                    var email = {
                        to: principal.email,
                        from: config.service_email_address,
                        subject: "Password Reset",      // TODO: Localization
                        text: "A password reset was requested for your Nitrogen account.  Your reset password is " + randomPassword + "\n" +
                              "Please login and change it as soon as possible."
                    };

                    services.email.send(email, function(err) {
                        return callback(err, principal);
                    });
                });
            });
        });      
};

var generateRandomPassword = function(callback) {
    crypto.randomBytes(config.reset_password_length, function(err, randomPasswordBuf) {
        if (err) return callback(err);

        var randomPasswordString = randomPasswordBuf.toString('base64').substr(0, config.reset_password_length);
        return callback(null, randomPasswordString);
    });
};

var update = function(authorizingPrincipal, id, updates, callback) {
    if (!authorizingPrincipal) return callback(utils.principalRequired());
    if (!id) return callback(utils.badRequestError('Missing required argument id.'));

    findById(authorizingPrincipal, id, function(err, principal) {
        if (err) return callback(err);

        if (!principal) return callback(utils.badRequestError("Can't find principal for update."));

        services.permissions.authorize({
            principal: authorizingPrincipal,
            principal_for: principal,
            action: 'admin'
        }, principal, function(err, permission) {
            if (err) return callback(err);
            if (!permission.authorized) return callback(utils.authorizationError(permission));

            models.Principal.update({ _id: id }, { $set: updates }, function (err, updateCount) {
                if (err) return callback(err);

                findById(authorizingPrincipal, id, function(err, updatedPrincipal) {
                    if (err) return callback(err);

                    // TODO: principals_realtime:  Disabled until rate limited to prevent update storms.

                    //notifySubscriptions(updatedPrincipal, function(err) {
                        return callback(err, updatedPrincipal);
                    //});
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
            body: {
                ip_address: ip
            }
        });

        services.messages.create(services.principals.servicePrincipal, ipMessage, function(err, message) {
            if (err) log.info("principal service: creating ip message failed: " + err);
        });
    }

    principal.last_connection = updates.last_connection = new Date();

    update(services.principals.servicePrincipal, principal.id, updates, function(err, principal) {
        if (err) return log.error("principal service: updating last connection failed: " + err);
    });
};

var updateVisibleTo = function(principalId, callback) {
    log.debug("principal service: updating visible_to for: " + principalId);
    findById(services.principals.servicePrincipal, principalId, function(err, principal) {
        if (err) return callback(err);
        if (!principal) return callback();
        log.debug("principal service: updating visible_to for principal id: " + principalId);

        if (!principal.public) {
            services.permissions.find(services.principals.servicePrincipal,
                { $and: [
                    { authorized: true },
                    { $or : [
                        { action: 'view' },
                        { action: null }
                      ]
                    },
                    { $or : [
                        { principal_for: principalId },
                        { principal_for: null }
                      ]
                    }
                  ]
                },
                {},
                function(err, permissions) {
                    if (err) return callback(err);

                    principal.visible_to = permissions.map(function(permission) {
                        log.debug("principal service: adding " + permission.issued_to + " to visible principals.");
                        return permission.issued_to;
                    });

                    log.debug("principal service: final visible_to: " + JSON.stringify(principal.visible_to));

                    services.principals.update(services.principals.servicePrincipal, principalId, { visible_to: principal.visible_to }, callback);
                }
            );
        } else {
            return callback(null, principal);
        }
    });
}

var validate = function(principal, callback) {
    var validType = false;

    models.Principal.PRINCIPAL_TYPES.forEach(function(type) {
        validType = validType || principal.type === type;
    });

    if (!validType) {
        var err = 'Principal type invalid. found: ' + principal.type;
        log.error(err);
        return callback(utils.badRequestError(err));
    }

    if (principal.is('user')) {
        if (!principal.email) return callback(utils.badRequestError("user principal must have email"));
        if (!principal.password) return callback(utils.badRequestError("user principal must have password"));        
    }

    callback(null);
};

var verifyPassword = function(password, user, callback) {
    var saltBuf = new Buffer(user.salt, 'base64');

    hashPassword(password, saltBuf, function(err, hashedPasswordBuf) {
        if (err) return callback(err);
        if (user.password_hash != hashedPasswordBuf.toString('base64'))
            return callback(utils.authenticationError(USER_AUTH_FAILURE_MESSAGE));
        else
            return callback(null);
    });
};

var verifySecret = function(secret, principal, callback) {
    hashSecret(secret, function(err, hashedSecret) {
        if (err) return callback(err);
        if (hashedSecret != principal.secret_hash) {
            log.warn("verification of secret for principal: " + principal.id + " failed");
            return callback(utils.authenticationError(DEVICE_AUTH_FAILURE_MESSAGE));
        }

        callback(null);
    });
};

module.exports = {
    authenticate: authenticate,
    changePassword: changePassword,
    create: create,
    filterForPrincipal: filterForPrincipal,
    find: find,
    findById: findById,
    generateClaimCode: generateClaimCode,
    impersonate: impersonate,
    initialize: initialize,
    resetPassword: resetPassword,
    removeById: removeById,
    update: update,
    updateLastConnection: updateLastConnection,
    updateVisibleTo: updateVisibleTo,
    verifySecret: verifySecret,
    verifyPassword: verifyPassword,

    servicePrincipal: null
};

var async = require('async') 
  , config = require('../config')
  , log = require('../log')
  , models = require('../models')
  , services = require('../services')
  , utils = require('../utils');

// permissions
//  send: send a message
//  sub: subscribe to this principal
//  admin: edit / delete this principal

var authorize = function(principal, action, obj, callback) {
    permissionsFor(principal, function(err, permissions) {
        if (err) return callback(err);

        // TODO: use async for this
        // look for a match in the sorted permissions
        for (var idx = 0; idx < permissions.length; idx++) {
            var permission = permissions[idx];

            // if we have a match, return the result.
            if (permission.match(principal, action, obj)) {
                log.info('principal: ' + principal.id + ' action: ' + action + ' object: ' + JSON.stringify(obj) + ' authorized => ' + permission.authorized);
                return callback(permission.authorized ? null : utils.authorizationError(permission));            
            }
        }

        // by default, actions are not authorized.
        // add a star permission at lowest priority to override this default.

        log.info('no match found: authorized => false');
        return callback(utils.authorizationError()); 
    });
};

var create = function(principal, permission, callback) {
    if (!principal) return callback(utils.principalRequired());

    permission.save(function(err, permission) {
        if (err) return callback(err);

        config.cache_provider.del('principalPermissions', permission.issuedTo, function(err) {
            callback(err, permission);
        });
    });
};

var findByIssuedTo = function(principal, callback) {
    models.Permission.find({ issuedTo: principal.id }, null, callback);    
};

var permissionsFor = function(principal, callback) {
    config.cache_provider.get('principalPermissions', principal.id, function(err, permissions) {
        if (err) return callback(err);
        if (permissions) return callback(null, permissions);

        findByIssuedTo(principal, function(err, permissions) {
            permissions.concat(config.default_permissions.map(function(permission) {
                return new models.Permission(permission);
            }));

            config.cache_provider.set('principalPermissions', principal.id, permissions, function(err) {
                return callback(err, permissions);
            });
        });
    });   
};

var remove = function(principal, permission, callback) {
    config.cache_provider.del('principalPermissions', permission.issuedTo, callback);
};

module.exports = {
    authorize: authorize,
    create: create,
    remove: remove
};

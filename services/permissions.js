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

var defaultPermissions = [];

var authorize = function(requestingPrincipal, principalFor, action, obj, callback) {
    permissionsFor(requestingPrincipal, function(err, permissions) {
        if (err) return callback(err);

        // look for a match in the sorted permissions
        // by default, actions are not authorized.
        // add a star permission at lowest priority to the default_permissions to override this default.
        async.detectSeries(permissions, function(permission, cb) {
            log.info('checking permission: issuedTo: ' + permission.issuedTo + ' principalFor: ' + permission.principalFor + ' action: ' + permission.action + ' filter: ' + permission.filter + ' authorized => ' + permission.authorized);
            cb(permission.match(requestingPrincipal, principalFor, action, obj));
        }, callback);
    });
};

var create = function(principal, permission, callback) {
    if (!principal) return callback(utils.principalRequired());

    permission.save(function(err, permission) {
        if (err) return callback(err);

        config.cache_provider.del('permissions', permission.issuedTo, function(err) {
            callback(err, permission);
        });
    });
};

var findByIssuedTo = function(principal, callback) {
    models.Permission.find({ issuedTo: principal.id }, null, callback);    
};

var initialize = function(callback) {
    defaultPermissions = config.default_permissions.map(function(permission) {
        if (permission.issuedTo === 'service') 
            permission.issuedTo = services.principals.servicePrincipal.id;
        if (permission.principalFor === 'service') 
            permission.principalFor = services.principals.servicePrincipal.id;

        return new models.Permission(permission);
    });

    callback();
};

var permissionsFor = function(principal, callback) {
    config.cache_provider.get('permissions', principal.id, function(err, permissions) {
        if (err) return callback(err);

        log.info('found cached permissions: ' + JSON.stringify(permissions));
        if (permissions) return callback(null, permissions);

        findByIssuedTo(principal, function(err, permissions) {
            permissions = permissions.concat(defaultPermissions);

            config.cache_provider.set('permissions', principal.id, permissions, utils.dateDaysFromNow(1), function(err) {
                return callback(err, permissions);
            });
        });
    });   
};

var remove = function(principal, permission, callback) {
    config.cache_provider.del('permissions', permission.issuedTo, callback);
};

module.exports = {
    authorize: authorize,
    create: create,
    initialize: initialize,
    remove: remove
};

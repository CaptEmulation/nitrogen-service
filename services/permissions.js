var async = require('async') 
  , config = require('../config')
  , log = require('../log')
  , models = require('../models')
  , services = require('../services')
  , utils = require('../utils');

var permissions = [];

// permissions
//  send: send a message
//  sub: subscribe to this principal
//  admin: edit / delete this principal

var authorize = function(principal, action, obj, callback) {
    // TODO: memcache this user permission set?
    /*
    var permissions = permissionsHash[principal.id]
                        .concat(permissionsHash['global'])
                    //  .concat(all_group_permissions_user_is_in)
                        .sort(models.Permission.priorityComparison);
    */

    // look for a match in the sorted permissions
    for (var idx = 0; idx < permissions.length; idx++) {
        var permission = permissions[idx];

        // if we have a match, return the result.
        if (permission.match(principal, action, obj)) {
            log.info('principal: ' + principal.id + ' action: ' + action + ' object: ' + JSON.stringify(obj) + ' authorized => ' + permission.authorized);
            return callback(!permission.authorized ? utils.authorizationError(permission) : null);            
        }
    }

    // by default, actions are not authorized.
    // add a star permission at lowest priority to override this default.

    log.info('no match found: authorized => false');
    return callback(utils.authorizationError()); 
};

var create = function(principal, permission, callback) {
    if (!principal) return callback(utils.principalRequired());

    permission.save(function(err, permission) {
        if (err) return callback(err);

        callback(null, permission);
    });
};

/*
var buildPermissionsHash = function(permissions) {
    permissions.forEach(function(permission) {
        var principalId = permission.principal.id || 'global';

        if (!permissionsHash[principalId]) {
            permissionsHash[principalId] = [];
        }

        permissionsHash[principalId].push(permissions);
    });
};
*/

var initialize = function(callback) {
    models.Permission.find({}, null, function(err, storedPermissions) {
        if (err) return callback(err);

        permissions = permissions.concat(storedPermissions);

        config.default_permissions.forEach(function(permission) {
            if (permission.principal === 'service') {
                permission.principal = services.principals.servicePrincipal.id;
            }

            permissions.push(new models.Permission(permission));
        });

        permissions.sort(models.Permission.priorityComparison);
        log.info('loaded ' + permissions.length + ' default permissions in total.');
        return callback();
    });
};

module.exports = {
    authorize: authorize,
    initialize: initialize
};
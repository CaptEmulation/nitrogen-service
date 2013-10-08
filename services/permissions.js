var async = require('async') 
  , config = require('../config')
  , log = require('../log')
  , models = require('../models')
  , services = require('../services');

var permissions = [];

var authorized = function(principal, action, obj) {
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
            return permission.authorized;            
        }
    }

    // by default, actions are not authorized.
    // add a star permission at lowest priority to override this default.

    log.info('no match found: authorized => false');
    return false;
};

var create = function(permission, callback) {

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
    console.log('***************** in permissions.initialize');
    models.Permission.find({}, null, function(err, storedPermissions) {
        if (err) return callback(err);

        permissions = permissions.concat(storedPermissions);

        config.default_permissions.forEach(function(permission) {
            console.log('loading default permission: ' + JSON.stringify(permission));
            if (permission.principal === 'service') {
                console.log('swapping string service principal for actual id.');
                permission.principal = services.principals.servicePrincipal.id;                
            }

            permissions.push(new models.Permission(permission));
        });

        permissions.sort(models.Permission.priorityComparison);
        console.log('permissions total: ' + permissions.length);
        return callback();
    });
};

module.exports = {
    authorized: authorized,
    initialize: initialize
};
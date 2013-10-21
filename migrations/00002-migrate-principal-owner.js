var async = require('async')
  , models = require('../models')
  , nitrogen = require('nitrogen')
  , services = require('../services');

exports.up = function(migrationCallback) {
    services.principals.find(services.principals.servicePrincipal, {}, {}, function(err, principals) {
        if (err) return callback(err);

        async.each(principals, function(principal, principalCallback) {
            if (principal.owner) {
                var permissions = [
                   services.permissions.translate({
                        type: 'admin',
                        issued_to: principal.owner,
                        principal_for: principal.id,
                        priority: nitrogen.Permission.NORMAL_PRIORITY
                    }),
                    services.permissions.translate({
                        type: 'send',
                        issued_to: principal.owner,
                        principal_for: principal.id,
                        priority: nitrogen.Permission.NORMAL_PRIORITY
                    })
                ];

                async.each(permissions, function(permission, permissionCallback) {
                    services.permissions.create(services.principals.servicePrincipal, permission, permissionCallback);
                }, function(err) {
                    if (err) return principalCallback(err);

                    services.principals.update(services.principals.servicePrincipal, principal.id, {owner: null}, principalCallback); 
                });
            }
        }, migrationCallback);
    });
};

// exports.down = function(callback) {
//    callback();
// };

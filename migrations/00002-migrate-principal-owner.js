var async = require('async')
  , models = require('../models')
  , nitrogen = require('nitrogen')
  , services = require('../services');

exports.up = function(migrationCallback) {
    models.Principal.find({}, function(err, principals) {
        if (err) return callback(err);

        async.each(principals, function(principal, principalCallback) {
            if (principal.owner) {
                var permissions = [
                   services.permissions.translate({
                        authorized: true,
                        action: 'admin',
                        issued_to: principal.owner,
                        principal_for: principal.id,
                        priority: nitrogen.Permission.NORMAL_PRIORITY
                    }),
                    services.permissions.translate({
                        authorized: true,
                        action: 'subscribe',
                        issued_to: principal.owner,
                        principal_for: principal.id,
                        priority: nitrogen.Permission.NORMAL_PRIORITY
                    }),
                    services.permissions.translate({
                        authorized: true,
                        action: 'send',
                        issued_to: principal.owner,
                        principal_for: principal.id,
                        priority: nitrogen.Permission.NORMAL_PRIORITY
                    }),
                    services.permissions.translate({
                        authorized: true,
                        action: 'view',
                        issued_to: principal.owner,
                        principal_for: principal.id,
                        priority: nitrogen.Permission.NORMAL_PRIORITY
                    })
                ];

                async.each(permissions, function(permission, permissionCallback) {
                    services.permissions.create(services.principals.servicePrincipal, permission, permissionCallback);
                }, function(err) {
                    if (err) return principalCallback(err);
                    services.principals.updateVisibleTo(principal.id, function(err) {
                        if (err) return principalCallback(err);

                        services.principals.update(services.principals.servicePrincipal, principal.id, {owner: null}, principalCallback); 
                    });
                });
            } else {
                services.principals.updateVisibleTo(principal.id, principalCallback);
            }
        }, migrationCallback);
    });
};

// exports.down = function(callback) {
//    callback();
// };

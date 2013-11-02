var async = require('async')
  , models = require('../models')
  , nitrogen = require('nitrogen')
  , services = require('../services');

exports.up = function(migrationCallback) {
    models.Principal.find({}, function(err, principals) {
        if (err) return callback(err);

        async.each(principals, function(principal, principalCallback) {
            if (principal.owner) {
                var permission = services.permissions.translate({
                    authorized: true,
                    issued_to: principal.owner,
                    principal_for: principal.id,
                    priority: nitrogen.Permission.NORMAL_PRIORITY
                });

                // create updates visible_to for the principal_for principal as part of creating the permission.
                services.permissions.create(services.principals.servicePrincipal, permission, function(err) {
                    if (err) return principalCallback(err);

                    services.principals.update(services.principals.servicePrincipal, principal.id, {owner: null}, principalCallback);
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

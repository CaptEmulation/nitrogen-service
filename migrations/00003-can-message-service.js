var async = require('async')
  , models = require('../models')
  , services = require('../services');

exports.up = function(callback) {
    var permissions = [
        // all principals are allowed to message the service
        services.permissions.translate({ 
            principal_for: 'service', 
            action: 'send', 
            authorized: true, 
            priority: 510 
        }),
    ];

    async.each(permissions, function(permission, cb) {
        services.permissions.create(services.principals.servicePrincipal, permission, cb);
    }, callback);
};

// exports.down = function(callback) {
//    callback();
// };

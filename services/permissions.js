var async = require('async') 
  , config = require('../config')
  , log = require('../log')
  , models = require('../models')
  , services = require('../services')
  , utils = require('../utils');

// STOPMERGE list:
// * Filtering permissions down to the ones a principal can see.
// * Authorization of principal to create a permission for a principal (does it have the right to grant that permission ?).

var authorize = function(request, obj, callback) {
    log.debug('authorizing ' + request.principal.id + ' for action: ' + request.action + ' for principal: ' + !request.principal_for ? "" : request.principal_for.id + ' on object: ' + JSON.stringify(obj));
    permissionsFor(request.principal, function(err, permissions) {
        if (err) return callback(err);

        // TODO: remove this once permissions is solid.
        permissions.forEach(function(permission) {
            log.debug(JSON.stringify(permission));
        });

        // look for a match in the sorted permissions and return that.
        // by default, actions are not authorized.
        // add a star permission at lowest priority to the default_permissions to override this default.
        async.detectSeries(permissions, function(permission, cb) {
            log.debug('checking permission: ' + JSON.stringify(permission));
            cb(permission.match(request, obj));
        }, function(permission) {
            log.info('authorize result: ' + JSON.stringify(permission));

            // to simplify logic in callback, if no permission is found, callback with an
            // unauthorized permission.

            if (!permission) {
                permission = { 
                    authorized: false
                };
            }
            
            return callback(null, permission);
        });
    });
};

var create = function(authPrincipal, permission, callback) {
    if (!authPrincipal) return callback(utils.principalRequired());
    if (!permission.action) return callback(new Error('permission must have action.'));
    if (permission.authorized !== false && permission.authorized !== true) return callback(new Error('permission must have authorized.'));

    // TODO: is authPrincipal authorized to create this permission.
    permission.save(function(err, permission) {
        if (err) return callback(err);

        config.cache_provider.del('permissions', permission.issued_to, function(err) {
            if (err) return callback(err);

            if (permission.action === 'view') {
                services.principals.updateVisibleTo(permission.principal_for, function(err) {
                    return callback(err, permission);
                });
            } else {
                return callback(null, permission);
            }
        });
    });
};

var filterForPrincipal = function(authPrincipal, filter) {
    // TODO: think through how permissions should be filtered.
    return filter;
};

var find = function(authPrincipal, filter, options, callback) {
    return models.Permission.find(filterForPrincipal(authPrincipal, filter), null, options, callback);
};

var findById = function(authPrincipal, permissionId, callback) {
    models.Permission.findOne(filterForPrincipal(authPrincipal, { "_id": permissionId }), callback);
};

var initialize = function(callback) {
    return callback();
};

var permissionsFor = function(principal, callback) {
    config.cache_provider.get('permissions', principal.id, function(err, permissions) {
        if (err) return callback(err);

        if (permissions) return callback(null, permissions);

        // TODO: this is a super broad query so we'll have to evaluate many many permissions.  
        // need to think about how to pull a more tightly bounded set of possible permissions for evaluation.
        find(services.principals.servicePrincipal, { $or : [{ issued_to: principal.id }, { issued_to: null }] }, { sort: { priority: 1 } }, function(err, permissions) {
            if (err) return callback(err);

            config.cache_provider.set('permissions', principal.id, permissions, utils.dateDaysFromNow(1), function(err) {
                return callback(err, permissions);
            });
        });
    });
};

var remove = function(authPrincipal, filter, callback) {
    // TODO: will need more complicated authorization mechanism for non service users.
    if (!authPrincipal || !authPrincipal.is('service')) return callback(utils.authorizationError());

    find(authPrincipal, filter, {}, function (err, permissions) {
        if (err) return callback(err);

        // invalidate cache entries
        async.eachLimit(permissions, 50, function(permission, cb) {
            permission.remove(function(err) {
                config.cache_provider.del('permissions', permission.issued_to, cb);
            });
        }, callback);
    });
};

var translate = function(obj) {
    if (obj.issued_to === 'service')
        obj.issued_to = services.principals.servicePrincipal.id;

    if (obj.principal_for === 'service')
        obj.principal_for = services.principals.servicePrincipal.id;

    return new models.Permission(obj);
};

module.exports = {
    authorize: authorize,
    create: create,
    find: find,
    initialize: initialize,
    remove: remove,
    translate: translate
};

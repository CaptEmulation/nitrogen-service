var async = require('async') 
  , config = require('../config')
  , log = require('../log')
  , models = require('../models')
  , services = require('../services')
  , utils = require('../utils');

// STOPMERGE list:
// * Remove use of principal.owner throughout code.
// * Use permissions to determine if principal is admin throughout code.
// * Filtering permissions down to the ones a principal can see.
// * Authorization of principal to create a permission for a principal (is it a subset?).
// * Optimizations on building permissions list for 'authorize'.

var defaultPermissions = [];
var mandatoryPermissions = [];

var authorize = function(requestingPrincipal, principalFor, action, obj, callback) {
    log.debug('authorizing ' + requestingPrincipal.id + ' for action: ' + action + ' on object: ' + JSON.stringify(obj));
    permissionsFor(requestingPrincipal, function(err, permissions) {
        if (err) return callback(err);

        // TODO: remove this once permissions is solid.
        permissions.forEach(function(permission) {
            log.debug(JSON.stringify(permission));
        });

        // look for a match in the sorted permissions
        // by default, actions are not authorized.
        // add a star permission at lowest priority to the default_permissions to override this default.
        async.detectSeries(permissions, function(permission, cb) {
            log.debug('checking permission: ' + JSON.stringify(permission));
            cb(permission.match(requestingPrincipal, principalFor, action, obj));
        }, callback);
    });
};

var create = function(authPrincipal, permission, callback) {
    if (!authPrincipal) return callback(utils.principalRequired());

    // TODO: is authPrincipal authorized to create this permission.
    permission.save(function(err, permission) {
        if (err) return callback(err);

        config.cache_provider.del('permissions', permission.issuedTo, function(err) {
            callback(err, permission);
        });
    });
};

var filterForPrincipal = function(authPrincipal, filter) {
    // TODO: think through how permissions should be filtered.
    return filter;
};

var find = function(authPrincipal, filter, options, callback) {
    models.Permission.find(filterForPrincipal(authPrincipal, filter), null, options, callback);
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
        find(services.principals.servicePrincipal, { $or : [{ issuedTo: principal.id }, { issuedTo: null }] }, { priority: 1 }, function(err, permissions) {
            if (err) return callback(err);

            config.cache_provider.set('permissions', principal.id, permissions, utils.dateDaysFromNow(1), function(err) {
                return callback(err, permissions);
            });
        });
    });
};

var remove = function(principal, permission, callback) {
    config.cache_provider.del('permissions', permission.issuedTo, function(err) {
        if (err) return callback(err);
    
        permission.remove(callback);
    });
};

var translate = function(obj) {
    if (obj.issuedTo === 'service')
        obj.issuedTo = services.principals.servicePrincipal.id;
    if (obj.principalFor === 'service')
        obj.principalFor = services.principals.servicePrincipal.id;

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
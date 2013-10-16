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
    defaultPermissions = config.default_permissions.map(translate);
    mandatoryPermissions = config.mandatory_permissions.map(translate);

    callback();
};

var permissionsFor = function(principal, callback) {
    config.cache_provider.get('permissions', principal.id, function(err, permissions) {
        if (err) return callback(err);

        if (permissions) return callback(null, permissions);

        // don't have cached permissions, so build up the permission list.
        permissions = [].concat(mandatoryPermissions);

        findByIssuedTo(principal, function(err, principalPermissions) {
            if (err) return callback(err);

            permissions = permissions.concat(principalPermissions).concat(defaultPermissions);

            config.cache_provider.set('permissions', principal.id, permissions, utils.dateDaysFromNow(1), function(err) {
                return callback(err, permissions);
            });
        });
    });   
};

var remove = function(principal, permission, callback) {
    config.cache_provider.del('permissions', permission.issuedTo, callback);
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
    initialize: initialize,
    remove: remove
};

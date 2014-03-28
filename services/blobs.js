var async = require('async')
  , config = require('../config')
  , log = require('../log')
  , models = require('../models')
  , mongoose = require('mongoose')
  , services = require('../services')
  , utils = require('../utils');

var canView = function(principal, blob, callback) {
    services.permissions.authorize({ 
        principal: principal.id,
        principal_for: blob.owner,
        action: 'view'
    }, blob, function(err, permission) {
        if (err) return callback(err);
        if (!permission.authorized) {
            log.warn('principal: ' + principal.id + ' attempted unauthorized view of blob: ' + blob.id + ' with owner: ' + blob.owner);
            return callback(utils.authorizationError(permission));
        }

        return callback(null);
    });
};

var create = function(principal, blob, stream, callback) {
    if (!config.blob_provider) return callback(utils.internalError('No blob provider configured.'));

    // TODO: authorization of principal to create blob here.

    config.blob_provider.create(blob, stream, function(err, blob) {
        if (err) return callback(err);

        blob.owner = principal;
        blob.id = new mongoose.Types.ObjectId();
        blob.link = new mongoose.Types.ObjectId();
        blob.url = config.blobs_endpoint + '/' + blob.id;

        blob.save(function(err, blob) {
            if (err) return callback(err);

            log.info('created blob with id: ' + blob.id);
            callback(null, blob);
        });
    });
};

var findById = function(blobId, callback) {
    models.Blob.findOne({"_id": blobId}, callback);
};

var initialize = function(callback) {
    config.blob_provider.initialize(callback);
};

var remove = function(principal, query, callback) {
    if (!principal || !principal.is('service')) {
        return callback(utils.authorizationError());
    }

    models.Blob.find(query, function (err, blobs) {

        async.eachLimit(blobs, 50, function(blob, cb) {
            config.blob_provider.remove(blob, cb);
        }, function(err) {
            if (err) return callback(err);

            models.Blob.remove(query, callback);
        });
    });
};

var stream = function(principal, blobId, stream, callback) {
    findById(blobId, function(err, blob) {
        if (err) return callback(err);
        if (!blob) return callback(utils.notFoundError());

        canView(principal, blob, function(err) {
            if (err) return callback(err);

            config.blob_provider.stream(blob, stream, callback);
        });
    });
};

module.exports = {
    create: create,
    findById: findById,
    initialize: initialize,
    remove: remove,
    stream: stream
};

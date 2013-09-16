var async = require('async')
  , config = require('../config')
  , log = require('../log')
  , models = require('../models')
  , mongoose = require('mongoose')
  , services = require('../services')
  , utils = require('../utils');

var create = function(principal, blob, stream, callback) {
    if (!config.blob_provider) {
        return callback(new utils.ServiceError({
            statusCode: 400,
            message: 'No blob provider configured.'
        }));
    }

    // TODO: authorization of principal to create blob here.

    config.blob_provider.create(blob, stream, function(err) {
        if (err) return callback(err);

        blob.owner = principal;
        blob.link = new mongoose.Types.ObjectId();

        blob.save(function(err, blob) {
            if (err) return callback(err);

            blob.url = config.blobs_endpoint + '/' + blob.id;
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
        if (!blob) return callback(null);

        // TODO: rethink blob authorization
//        if (!blob.owner.equals(principal._id) && !blob.owner.equals(principal.owner)) {
//            return callback(utils.authorizationError());
//        }

        config.blob_provider.stream(blob, stream, callback);
    });
};

module.exports = {
    create: create,
    findById: findById,
    initialize: initialize,
    remove: remove,
    stream: stream
};
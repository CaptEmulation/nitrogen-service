var async = require('async')
  , config = require('../config')
  , log = require('../log')
  , models = require('../models')
  , mongoose = require('mongoose')
  , services = require('../services');

var create = function(principal, blob, stream, callback) {
    if (!config.blob_provider) return callback("No blob provider configured.");

    // TODO: authorization of principal to create blob here.

    config.blob_provider.create(blob, stream, function(err) {
        if (err) return callback(err, null);

        blob.owner = principal;
        blob.link = new mongoose.Types.ObjectId;

        blob.save(function(err, blob) {
            if (err) return callback(err, null);

            blob.url = config.blobs_endpoint + '/' + blob.id;
            log.info('created blob with id: ' + blob.id);
            callback(null, blob);
        });
    });
};

var findById = function(blobId, callback) {
    models.Blob.findOne({"_id": blobId}, callback);
};

var remove = function(principal, query, callback) {
    if (!principal || !principal.is('system')) return callback("Only system can delete messages");

    models.Blob.find(query, function (err, blobs) {

        async.eachLimit(blobs, 50, function(blob, cb) {
            config.blob_provider.remove(blob, cb);
        }, function(err) {
            if (err) return callback(err);

            models.Blob.remove(query, callback);
        });
    });
};

var stream = function(blobId, stream, callback) {
    findById(blobId, function(err, blob) {
        if (err) return callback(err, null);
        if (!blob) return callback(null, null);

        // TODO:  do authorization here

        config.blob_provider.stream(blob, stream, callback);
    });
};

module.exports = {
    create: create,
    findById: findById,
    remove: remove,
    stream: stream
};
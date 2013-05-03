var async = require('async')
  , config = require('../config')
  , log = require('../log')
  , models = require('../models')
  , mongoose = require('mongoose')
  , services = require('../services');

var create = function(principal, blob, stream, callback) {

    // TODO: authorization of principal to create blob here.

    config.blob_provider.create(blob, stream, function(err) {
        if (err) return callback(err, null);

        blob.owner = principal;
        blob.link = new mongoose.Types.ObjectId;

        blob.save(function(err, blob) {
            if (err) return callback(err, null);

            log.info('created blob with id: ' + blob._id);
            callback(null, blob);
        });
    });
};

var remove = function(principal, query, callback) {
    if (!principal || !principal.isSystem()) return callback("Only system can delete messages");

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
    models.Blob.findOne({"_id": blobId}, function (err, blob) {
        if (err) return callback(err, null);
        if (!blob) return callback(null, null);

        // TODO:  do authorization here

        config.blob_provider.stream(blob, stream, callback);
    });
};

module.exports = {
    create: create,
    remove: remove,
    stream: stream
};

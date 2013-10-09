var async = require('async')
  , config = require('../config')
  , log = require('../log')
  , models = require('../models')
  , mongoose = require('mongoose')
  , services = require('../services')
  , utils = require('../utils');

var canView = function(principal, blob, callback) {
    // if this principal is the owner, then this is easy.
    if (principal.owns(blob)) return callback(true);

    // fetch the owner of the blob to see if the principal owns that.
    // enables user owes camera owes blob type scenarios.
    services.principals.findById(services.principals.servicePrincipal, blob.owner, function(err, owningPrincipal) {
        if (err) return callback(err);

        return callback(principal.owns(owningPrincipal));
    });
};

var create = function(principal, blob, stream, callback) {
    if (!config.blob_provider) return callback(utils.internalError('No blob provider configured.'));

    // TODO: authorization of principal to create blob here.

    config.blob_provider.create(blob, stream, function(err) {
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

        canView(principal, blob, function(authorized) {
            if (!authorized) return callback(utils.authorizationError());

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
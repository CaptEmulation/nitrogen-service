var models = require('../models')
  , mongodb = require('mongodb')
  , services = require('../services')
  , utils = require('../utils');

exports.show = function(req, res) {
    services.blobs.stream(req.user, req.params.id, res, function(err, blob) {
      if (err) return utils.handleError(res, err);
      if (!blob) return utils.handleError(res, utils.notFoundError());
    });
};

exports.create = function(req, res) {
	var blob = new models.Blob({
        content_type: req.get('Content-Type'),
        content_length: req.get('Content-Length')
    });

    services.blobs.create(req.user, blob, req, function(err, blob) {
         if (err) return utils.handleError(err);

         res.send({ blob: blob });
    });
};
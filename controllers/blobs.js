var models = require('../models'),
    mongodb = require('mongodb'),
    services = require('../services');

exports.show = function(req, res) {
    services.blobs.stream(req.params.id, res, function(err, blob) {
      if (err) return res.send(400, err);
      if (!blob) return res.send(404);
    });
};

exports.create = function(req, res) {
	var blob = new models.Blob();
	blob.id = new mongodb.ObjectID();
	blob.content_type = req.get('Content-Type');
	blob.content_length = req.get('Content-Length');

    services.blobs.create(blob, req, function(err, blob) {
         if (err)
            res.send(400, err);
         else
            res.send({"blob": blob});
    });
};
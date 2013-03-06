var azure = require('azure'),
	config = require('../config'),
	models = require('../models'),
	mongodb = require('mongodb');

var blobService = azure.createBlobService(config.azure_storage_account,
										  config.azure_storage_key,
										  config.azure_storage_endpoint);

blobService.createContainerIfNotExists(
	"blobs",
	function(error) {
        if (error) console.log("not able to create/confirm blob container: " + error);
    }
);

exports.show = function(req, res) {
	models.Blob.findOne({"_id": req.params.id}, function (err, blob) {
		if (err) return res.send(400, err);
		if (!blob) return res.send(404);

		blobService.getBlobToStream("blobs", blob.id, res, function(error) {
			if (err) return res.send(400, err);
    	});

	});
};

exports.create = function(req, res) {
	var blob = new models.Blob();
	blob.id = new mongodb.ObjectID();
	blob.content_type = req.get('Content-Type');
	blob.content_length = req.get('Content-Length');

	blobService.createBlockBlobFromStream("blobs", blob.id, req, blob.content_length,
		{"contentType": blob.content_type},
		function(err, blobResult, response) {
			if (err) return res.send(400);

			blob.save(function(err, blob) {
				if (err) return res.send(400);

				console.log('created blob with id: ' + blob._id);
				res.send({"blob": blob.toClientObject()});
			});
		});
};
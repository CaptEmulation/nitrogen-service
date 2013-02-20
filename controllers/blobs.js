var azure = require('azure'),
	Config = require('../config'),
	Blob = require("../models/blob").Blob,
	ObjectID = require('mongodb').ObjectID;

var config = new Config();
var blobService = azure.createBlobService(config.azure_storage_account, config.azure_storage_key, config.azure_storage_endpoint);

blobService.createContainerIfNotExists(
	"blobs", 
	function(error) {
        if (error) throw error;
    }
);

exports.show = function(req, res) {
	Blob.findOne({"_id": req.params.id}, function (err, blob) {
		if (err) return res.send(400, err);
		if (!blob) return res.send(404);

		blobService.getBlobToStream("blobs", blob.id, res, function(error) {
			if (err) return res.send(400, err);
    	});

	});
};

exports.create = function(req, res) {
	var blob = new Blob();
	blob.id = new ObjectID();

	blobService.createBlockBlobFromStream("blobs", blob.id, req, req.get('Content-Length'), {"contentType": req.get('Content-Type')}, 
		function(err, blobResult, response) {
			if (err) return res.send(400);

			blob.save(function(err, blob) {
				if (err) return res.send(400); 

			    var blob_url = config.base_url + '/blobs/' + blob._id;
			    console.log("created blob: " + blob_url);

				res.send({"blob": blob});
			});
		});
};

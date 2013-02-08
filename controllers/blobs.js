var azure = require('azure'),
	Config = require('../config'),
	Blob = require("../models/blob").Blob;

var config = new Config();
var blobService = azure.createBlobService(config.azure_storage_account, config.azure_storage_key, config.azure_storage_endpoint);
console.log("created blob service");

blobService.createContainerIfNotExists(
	"blobs", { publicAccessLevel : 'blob' }, 
	function(error) {
        if (error) throw error;
    }
);

exports.findById = function(req, res) {
	Blob.findOne({"_id": req.params.id}, function (err, blob) {
		if (err) res.send(400);

		blobService.getBlobToStream("blobs", blob.id, res, function(error) {
			if (err) res.send(400);
    	});
	});
};

exports.create = function(req, res) {
	var buffers = new Array();

	req.on('data', function(chunk) {
		buffers.push(chunk);
	});

	req.on('end', function() {
		var data = Buffer.concat(buffers);
		var blob = new Blob();
		blob.save(function(err, blob) {
			if (!err) {
				blobService.createBlobBlockFromText(blob.id, "blobs", blob.id, data.toString(), {"contentType": req.get('Content-Type')}, 
					function (err, blobResult, response) {
						blobService.commitBlobBlocks("blobs", blob.id, [blob.id], {"contentType": req.get('Content-Type')}, 
							function(err, blobResult, response) {
								blob.url = config.base_url + "/blobs/" + blob.id;
								res.send(blob);
							});
					}
				);
			} else {
				console.log("TODO:  couldn't create blob for some reason.");
			}
		});
	});
};
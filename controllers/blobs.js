var azure = require('azure'),
	Config = require('../config'),
	Blob = require("../models/blob").Blob;

var config = new Config();
var blobService = azure.createBlobService(config.azure_storage_account, config.azure_storage_key, config.azure_storage_endpoint);
console.log("created blob service");

blobService.createContainerIfNotExists(
	"blobs", { publicAccessLevel : 'blob' }, 
	function(error) {
        if (error){
        	console.log("error creating and perm'ing container.");
        } else {
        	console.log("container created and permissioned.");        	
        }
	}
);

exports.findById = function(req, res) {
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
								console.log(blobResult);
								res.send(blob);
							}); 
					}
				);
			}
		});
	});

};
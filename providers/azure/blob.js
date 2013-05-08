var azure = require('azure'),
    log = require('../../log');

var BLOB_CONTAINER = "blobs";

function AzureBlobProvider(config) {
    var azure_storage_account = config.azure_storage_account || process.env.AZURE_STORAGE_ACCOUNT;
    var azure_storage_key = config.azure_storage_key || process.env.AZURE_STORAGE_KEY;
    var azure_storage_endpoint = azure_storage_account + ".blob.core.windows.net";

    if (!azure_storage_account || !azure_storage_key) {
        log.warn("WARNING: Azure storage account or key not configured.  Set AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY as environment variables to configure the azure blob provider.");
        return;
    }

    this.azureBlobService = azure.createBlobService(azure_storage_account,
                                                    azure_storage_key, azure_storage_endpoint);

    this.azureBlobService.createContainerIfNotExists(
        "blobs",
        function(err) {
            if (err) log.error("Azure Blob Provider: Not able to create/confirm blob container: " + err);
        }
    );
}

AzureBlobProvider.prototype.create = function(blob, stream, callback) {
    this.azureBlobService.createBlockBlobFromStream(BLOB_CONTAINER, blob.id, stream, blob.content_length,
        {"contentType": blob.content_type},
        function(err, blobResult, response) {
            callback(err, blob);
        });
};

AzureBlobProvider.prototype.stream = function(blob, stream, callback) {
    this.azureBlobService.getBlobToStream(BLOB_CONTAINER, blob.id, stream, callback);
};

AzureBlobProvider.prototype.remove = function(blob, callback) {
    this.azureBlobService.deleteBlob(BLOB_CONTAINER, blob.id, callback);
};

module.exports = AzureBlobProvider;
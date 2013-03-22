var providers = require('./providers');
var config = null;

if (process.env.NODE_ENV == "production") {
    config = {
        host: process.env.HOST_NAME,
        protocol: "http"
    };
} else if (process.env.NODE_ENV == "test") {
    config = {
        host: "localhost",
        http_port: 3050,
        protocol: "http",

        mongodb_connection_string: "mongodb://localhost/magenta_test"
    };
} else {
    config = {
        host: "localhost",
        http_port: 3030,
        protocol: "http",

        mongodb_connection_string: "mongodb://localhost/magenta_dev"
    };
}

config.mongodb_connection_string = config.mongodb_connection_string || process.env.MONGODB_CONNECTION_STRING;

config.api_prefix = "/api/";
config.path_prefix = config.api_prefix + "v1";
config.base_url = config.protocol + "://" + config.host + ":" + config.http_port + config.path_prefix;

// NOTE:  cannot have a trailing slash on realtime_path below or faye client will fail.
config.realtime_path = "/realtime";
config.realtime_url = config.base_url + config.realtime_path;

config.blobs_endpoint = config.base_url + "/blobs/";
config.messages_endpoint = config.base_url + "/messages/";
config.principals_endpoint = config.base_url + "/principals/";

config.blob_provider = new providers.azure.AzureBlobProvider(config);
module.exports = config;
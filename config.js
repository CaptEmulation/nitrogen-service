var log = require('./log')
  , Loggly = require('winston-loggly').Loggly
  , providers = require('./providers')
  , winston = require('winston');

var config = null;

if (process.env.NODE_ENV == "production") {
    config = {
        http_port: 443,
        protocol: "https"
    };
} else if (process.env.NODE_ENV == "test") {
    config = {
        http_port: 3050,
        mongodb_connection_string: "mongodb://localhost/nitrogen_test"
    };
} else {
    config = {
        http_port: 3030,
        mongodb_connection_string: "mongodb://localhost/nitrogen_dev"
    };
}

config.protocol = process.env.PROTOCOL || config.protocol || "http";
config.host = process.env.HOST_NAME || config.host || "localhost";
config.http_port = process.env.HTTP_PORT || config.http_port || 3030;
config.mongodb_connection_string = config.mongodb_connection_string || process.env.MONGODB_CONNECTION_STRING;

config.api_prefix = "/api/";
config.path_prefix = config.api_prefix + "v1";

config.base_url = config.protocol + "://" + config.host;

if (config.http_port != 80)
    config.base_url += ":" + config.http_port

config.base_url += config.path_prefix;

// NOTE:  realtime_path below cannot have trailing slash or faye client will fail.
config.realtime_path = "/realtime";
config.realtime_endpoint = config.base_url + config.realtime_path;
config.realtime_endpoint_timeout = 90; // seconds

config.agents_endpoint = config.base_url + "/agents";
config.blobs_endpoint = config.base_url + "/blobs";
config.messages_endpoint = config.base_url + "/messages";
config.principals_endpoint = config.base_url + "/principals";
config.ops_endpoint = config.base_url + "/ops";

config.password_hash_iterations = 10000;
config.password_hash_length = 128;
config.salt_length_bytes = 64;

config.access_token_bytes = 64;
config.device_secret_bytes = 128;

config.request_log_format = ':remote-addr - - [:date] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ":referrer" ":user-agent"';

if (process.env.AZURE_STORAGE_ACCOUNT && process.env.AZURE_STORAGE_KEY) {
    config.blob_provider = new providers.azure.AzureBlobProvider(config);
}

if (process.env.LOGGLY_SUBDOMAIN && process.env.LOGGLY_INPUT_TOKEN && process.env.LOGGLY_USERNAME && process.env.LOGGLY_PASSWORD) {
    log.add(winston.transports.Loggly, {
        "subdomain": process.env.LOGGLY_SUBDOMAIN,
        "inputToken": process.env.LOGGLY_INPUT_TOKEN,
        "auth": {
            "username": process.env.LOGGLY_USERNAME,
            "password": process.env.LOGGLY_PASSWORD
        }
    });
}

log.add(winston.transports.Console, { colorize: true, timestamp: true });

module.exports = config;

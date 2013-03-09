var config = null;

if (process.env.NODE_ENV == "production") {
    config = {
        host: process.env.HOST_NAME,
        protocol: "http",

        mongodb_connection_string: process.env.MONGODB_CONNECTION_STRING,

        azure_storage_account: process.env.AZURE_STORAGE_ACCOUNT,
        azure_storage_key: process.env.AZURE_STORAGE_KEY,
        azure_storage_endpoint: process.env.AZURE_STORAGE_ENDPOINT,
    };
} else if (process.env.NODE_ENV == "test") {
    config = {
        host: "localhost",
        http_port: 3050,
        protocol: "http",

        redis_port: 6379,
        redis_host: "localhost",

        mongodb_connection_string: "mongodb://localhost/magenta_test",

        azure_storage_account: "magentadev",
        azure_storage_key: "jU+As2CX8WFu/lWOX85PQzG3f+GhNx2SNaeYIpZeNZQ4sndHxX/D3rZtPjlwL+Lq5Zr+7ggLHbT3ytz1izzTJw==",
        azure_storage_endpoint: "magentadev.blob.core.windows.net"
    };
} else {
    config = {
        host: "localhost",
        http_port: 3030,
        protocol: "http",

        redis_port: 6379,
        redis_host: "localhost",

        mongodb_connection_string: "mongodb://localhost/magenta_dev",

        azure_storage_account: "magentadev",
        azure_storage_key: "jU+As2CX8WFu/lWOX85PQzG3f+GhNx2SNaeYIpZeNZQ4sndHxX/D3rZtPjlwL+Lq5Zr+7ggLHbT3ytz1izzTJw==",
        azure_storage_endpoint: "magentadev.blob.core.windows.net"
    };        
}

// common & computed properties 

config.path_prefix = "/api/v1";
config.base_url = config.protocol + "://" + config.host + ":" + config.http_port + config.path_prefix;

// NOTE:  cannot have a trailing slash on realtime_path below or faye client will fail.
config.realtime_path = "/realtime";
config.realtime_url = config.base_url + config.realtime_path;

module.exports = config;
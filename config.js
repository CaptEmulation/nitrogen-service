module.exports = function() {
    var config = null;

    if (process.env.NODE_ENV == "production") {
        config = {
            host: "magenta.azurewebsites.net",
            protocol: "http",

            mongodb_connection_string: "mongodb://magenta-mongodb:5eGtQRz5dDNukmDTf6hEUfTuoj2cBwUGiOiTfo0vDVI-@ds045107.mongolab.com:45107/magenta-mongodb",

            azure_storage_account: "magenta",
            azure_storage_key: "qPvb6jLVnT4s9/xv6aTxVLDoAEiNnX9qazbl32NO+gO6G+H7txhBw/UYsEC/Jgz30EGzODJs/pIC1UajGb7CIw==",
            azure_storage_endpoint: "magenta.blob.core.windows.net"
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

    // computed properties 

    config.base_url = config.protocol + "://" + config.host + ":" + config.http_port;
    return config;
};

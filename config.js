module.exports = function() {
    var config = null;

    switch(process.env.NODE_ENV){
        case 'production':
            config = {
                host: "magenta.windows.net",
                http_port: 80,
                protocol: "http",

            	mongodb_url: "mongodb://localhost/magenta",

                azure_storage_account: "magenta",
                azure_storage_key: "qPvb6jLVnT4s9/xv6aTxVLDoAEiNnX9qazbl32NO+gO6G+H7txhBw/UYsEC/Jgz30EGzODJs/pIC1UajGb7CIw==",
                azure_storage_endpoint: "magenta.blob.core.windows.net"
           	};

        case 'test':
        	config = {
                host: "localhost",
                http_port: 3050,
                protocol: "http",

            	mongodb_url: "mongodb://localhost/magenta_test",

                azure_storage_account: "magentadev",
                azure_storage_key: "jU+As2CX8WFu/lWOX85PQzG3f+GhNx2SNaeYIpZeNZQ4sndHxX/D3rZtPjlwL+Lq5Zr+7ggLHbT3ytz1izzTJw==",
                azure_storage_endpoint: "magentadev.blob.core.windows.net"
        	};

        default: 
        case 'development':
            config = {
                host: "localhost",
                http_port: 3030,
                protocol: "http",

            	mongodb_url: "mongodb://localhost/magenta_dev",

                azure_storage_account: "magentadev",
                azure_storage_key: "jU+As2CX8WFu/lWOX85PQzG3f+GhNx2SNaeYIpZeNZQ4sndHxX/D3rZtPjlwL+Lq5Zr+7ggLHbT3ytz1izzTJw==",
                azure_storage_endpoint: "magentadev.blob.core.windows.net"
        	};
    }

    // computed properties 

    config.base_url = config.protocol + "://" + config.host + ":" + config.http_port;
    return config;
};
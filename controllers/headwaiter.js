var config = require('../config');

exports.index = function(req, res) {
    var response = {
        endpoints: {
            agents_endpoint: config.agents_endpoint,
            messages_endpoint: config.messages_endpoint,
            principals_endpoint: config.principals_endpoint,
            subscriptions_endpoint: config.subscriptions_endpoint
        }
    };

    if (config.blob_provider) {
        response.endpoints.blobs_endpoint = config.blobs_endpoint;
    }

    res.send(response);
};
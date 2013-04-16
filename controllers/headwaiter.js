var config = require('../config');

exports.index = function(req, res) {

    // Could do principal level or service group level redirection here
    // But use static routing to API endpoints for now.

    res.send({ endpoints: {
                    agents_endpoint: config.agents_endpoint,
                    blobs_endpoint: config.blobs_endpoint,
                    messages_endpoint: config.messages_endpoint,
                    principals_endpoint: config.principals_endpoint,
                    realtime_endpoint: config.realtime_endpoint
               }
    });
};
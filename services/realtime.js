var bayeux = null
  , faye = require('faye')
  , services = require("../services");

var attach = function(server, config) {
    bayeux = new faye.NodeAdapter({
        mount: config.path_prefix + config.realtime_path,
        timeout: config.realtime_endpoint_timeout
    });
    bayeux.addExtension({
        incoming: function(message, callback) {
            if (message.channel != "/meta/subscribe") return callback(message);

            if (!message.ext) {
                message.error = "Access token required for realtime endpoint";
                callback(message);
            } else {
                console.log("verifying access token for realtime endpoint: " + message.ext.access_token);
                services.accessTokens.verify(message.ext.access_token, function(err, principal) {
                    if (err) message.error = "Verification of access token failed";
                    if (!principal) message.error = "Access token is invalid";

                    if (message.error) console.log("verification of access token failed: " + message.error);

                    // TODO: authorization for particular channel

                    callback(message);
                });
            }
        }
    });

    bayeux.attach(server);

    console.log('listening for realtime connections on ' + config.path_prefix + config.realtime_path);
};

var bind = function(event, f) {
    bayeux.bind(event, f);
};

var publish = function(channel, message) {
    if (!bayeux) return;

    var client = bayeux.getClient();
    client.publish(channel, message);
};

module.exports = {
    attach: attach,
    publish: publish,

    bind: bind      // for testing use
};


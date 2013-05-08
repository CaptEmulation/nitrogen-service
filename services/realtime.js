var bayeux = null
  , faye = require('faye')
  , log = require('../log')
  , services = require('../services')
  , utils = require('../utils');

var authorize = function(principal, message) {
    if (utils.stringStartsWith(message.subscription, "/messages")) {
        if (message.subscription != "/messages/" + principal.id) {
            log.error("realtime subscription not authorized for principal " + principal.principal_type + ":" + principal.id + " for " + message.subscription);
            message.error = "403::Forbidden";
        } else {
            log.info("realtime subscription authorized for principal: " + principal.principal_type + ":" + principal.id + " for " + message.subscription);
        }
    } else {
        message.error = "404:NotFound";
    }
};

var attach = function(server, config) {

    bayeux = new faye.NodeAdapter({
        mount: config.path_prefix + config.realtime_path,
        timeout: config.realtime_endpoint_timeout
    });

    bayeux.addExtension({
        incoming: function(message, callback) {
            if (message.channel != "/meta/subscribe") return callback(message);

            if (!message.ext) {
                message.error = "401::Unauthorized";
                callback(message);
            } else {
                services.accessTokens.verify(message.ext.access_token, function(err, principal) {
                    if (err || !principal) message.error = "401::Unauthorized";

                    if (!message.error) authorize(principal, message);

                    if (message.error) log.error("auth failed: " + message.error);

                    callback(message);
                });
            }
        }
    });

    bayeux.attach(server);

    log.info('listening for realtime connections on ' + config.path_prefix + config.realtime_path);
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


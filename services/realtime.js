var async = require('async')
  , faye = require('faye')
  , log = require('../log')
  , services = require('../services')
  , utils = require('../utils');

var bayeux;

var authorize = function(principal, message) {
    async.some(['/messages', '/principals'], function(prefix, callback) {
        var matches = utils.stringStartsWith(message.subscription, prefix);
        if (matches)
            checkEndpointAuthorization(principal, message, prefix);

        return callback(matches);
    }, function (matched) {
        if (!matched)
            message.error = "404:NotFound";
    });
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

var checkEndpointAuthorization = function(principal, message, prefix) {
    if (message.subscription !== prefix + '/' + principal.id) {
        log.error('realtime subscription not authorized for principal ' + principal.type + ':' + principal.id + ' for ' + message.subscription);
        message.error = "403::Forbidden";
    } else {
        log.info('realtime subscription authorized for principal: ' + principal.type + ':' + principal.id + ' for ' + message.subscription);
    }
};

var publish = function(channel, message) {
    if (!bayeux) return;

    var client = bayeux.getClient();
    log.info('publishing to ' + channel + ': ' + message);
    client.publish(channel, message);
};

module.exports = {
    attach: attach,
    publish: publish,

    bind: bind      // for testing use
};


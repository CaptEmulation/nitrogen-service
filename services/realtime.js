var bayeux = null
  , faye = require('faye');

var attach = function(server, config) {
    bayeux = new faye.NodeAdapter({
        mount: config.path_prefix + config.realtime_path,
        timeout: config.realtime_endpoint_timeout
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


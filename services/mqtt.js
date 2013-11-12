var log = require('../log')
  , mqtt = require('mqtt');

var start = function(config) {
    if (config.mqtt_unencrypted_port) {
        mqtt.createServer(server).listen(config.mqtt_unencrypted_port);
    }

    if (config.mqtt_encrypted_port && config.ssl_private_key_path && config.ssl_public_cert_path)  {
        mqtt.createSecureServer(
            config.ssl_private_key_path,
            config.ssql_public_cert_path,
            server
        ).listen(config.mqtt_encrypted_port);
    }
};

var server = function(client) {
    client.on('connect', function(packet) {
        // TODO: parse packet for username and secret
        // TODO: authenticate
        // TODO: store away principal on this connection;

        client.connack({returnCode: 0});
    });
(
    client.on('publish', function(packet) {
        // TODO: services.messages.create(principal from connection, packet.payload) 
    });

    client.on('subscribe', function(packet) {

        var granted = packet.subscriptions.map(function(subscription) {
            if (authorized) {
                // TODO: setup actual subscription against service that sends publish messages back to client.
                return packet.subscriptions[i].qos;
            }
            else
                return 0;
        });

        client.suback({granted: granted, messageId: packet.messageId});

    });

    client.on('pingreq', function(packet) {
        client.pingresp();
    });

    client.on('disconnect', function(packet) {
        client.stream.end();
    });

//    client.on('close', function(err) {
//        delete self.clients[client.id];
//    });

    client.on('error', function(err) {
        client.stream.end();
        log.error(err);
    });
};

module.exports = {
    start: start
};
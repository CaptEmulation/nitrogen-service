var async = require('async')
  , config = require('../config')
  , log = require('../log')
  , models = require('../models')
  , mongoose = require('mongoose')
  , services = require('../services')
  , utils = require('../utils');

var io;

var attach = function(server) {
    if (!config.pubsub_provider) return log.info('pubsub provider not configured: subscription endpoint not started.');

    io = require('socket.io').listen(server);

    attachAuthFilter();
    attachSubscriptionsEndpoint();

    log.info('listening for realtime connections on ' + config.subscriptions_path);
};

var attachAuthFilter = function() {
    io.configure(function () {
        io.set('authorization', function (handshakeData, callback) {
            console.log('^^^^^^^^^^ got handshake auth request: ' + JSON.stringify(handshakeData));
            if (!handshakeData.query.auth) return callback(null, false);

            console.log('^^^^^^^^^^ auth token: ' + handshakeData.query.auth);

            services.accessTokens.verify(handshakeData.query.auth, function(err, principal) {
                var success = !err && principal;

                handshakeData.principal = principal;

                callback(null, success);
            });
        });
    });
};

var attachSubscriptionsEndpoint = function() {
    io.sockets.on('connection', function(socket) {
        console.log('########## handshake: ' + JSON.stringify(socket.handshake));

        if (!socket.handshake.query.type || !socket.handshake.principal) return log.error('subscription request without type and/or principal.');

        var subscription = new models.Subscription({
            filter: socket.handshake.query.q || {},
            name: socket.handshake.query.name,
            principal: socket.handshake.principal.id,
            type: socket.handshake.query.type
        });

        findOrCreate(subscription, function(err, subscription) {
            if (err) return log.error('subscriptions: findOrCreate failed: ' + err);

            var connected = true;
            socket.on('disconnect', function() { connected = false; });

            log.info('subscriptions: connecting subscription: ' + subscription.id);

            socket.emit('ready');

            async.whilst(
                function() { return connected; },
                function(callback) {
                    config.pubsub_provider.receive(subscription, function(err, item) {
                        if (err) return callback(err);

                        console.log('received subscription notification from pubsub_provider, emitting on socket.io: ' + subscription.type + ": " + item);
                        socket.emit(subscription.type, item);

                        callback();
                    });
                },
                function() {
                    log.info('subscriptions: disconnecting subscription: ' + subscription.id);
                }
            );

        });

        // TODO: add ability to create messages through the realtime endpoint.
        //socket.on('message', function(message) {});
    });
};

var create = function(subscription, callback) {
    subscription.permanent = !!subscription.name;
    if (!subscription.permanent) {
        // assign a random name if this is a non-permanent subscription.
        subscription.name = new mongoose.Types.ObjectId;
    }

    config.pubsub_provider.createSubscription(subscription, function(err) {
        if (err) callback(err);

        subscription.save(callback);
    });
};

var findOne = function(subscription, callback) {
    models.Subscription.findOne({
        principal: subscription.principal,
        type: subscription.type,
        name: subscription.name
    }, callback);
};

var findOrCreate = function(subscription, callback) {

    console.log('in findOrCreate');

    findOne(subscription, function(err, existingSubscription) {
        console.log("findOrCreate: err: " + err + " existingSubscription: " + existingSubscription);
        if (err) return callback(err);
        if (existingSubscription) return callback(null, existingSubscription);

        create(subscription, callback);
    });
};

var publish = function(type, item, callback) {
    if (!config.pubsub_provider) return log.error("subscriptions: can't publish without pubsub_provider");

    log.info("publishing " + type + ": " + item.id + " to subscribers");
    config.pubsub_provider.publish(type, item, callback);
};

module.exports = {
    attach: attach,
    create: create,
    publish: publish
};
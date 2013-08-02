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
            if (!handshakeData.query.auth) return callback(null, false);

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
        if (!socket.handshake.query.type || !socket.handshake.principal) return log.error('subscription request without type and/or principal.');

        var subscription = new models.Subscription({
            filter: socket.handshake.query.filter || {},
            name: socket.handshake.query.name,
            principal: socket.handshake.principal.id,
            type: socket.handshake.query.type,
        });

        findOrCreate(subscription, function(err, subscription) {
            if (err) return log.error('subscriptions: failed to create: ' + err);

            var connected = true;
            socket.on('disconnect', function() {
                connected = false;
                log.info('subscriptions: socket: ' + socket.id + ' disconnected.  permanent? ' + subscription.permanent);

                remove(subscription);
            });

            log.info('subscriptions: connecting subscription: ' + subscription.id);

            socket.emit('ready');

            async.whilst(
                function() { return connected; },
                function(callback) {
                    log.info('starting receive for socket: ' + socket.id);
                    config.pubsub_provider.receive(subscription, function(err, item) {
                        if (err) return callback(err);

                        // there might not be an item in the case the pubsub_provider's long poll et al timed out.
                        // in this case, we just need to check that we are still connected and restart the receive.
                        if (item) {
                            log.info('subscriptions:  new message from subscription: ' + socket.id + ' of type: ' + subscription.type + ": " + JSON.stringify(item));
                            socket.emit(subscription.type, item);
                        }

                        callback();
                    });
                },
                function(err) {
                    if (err) log.error(err);

                    log.info('subscriptions: ending socket: ' + socket.id);
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
        // assign a random name and id if this is a non-permanent subscription.
        subscription.id = subscription.name = new mongoose.Types.ObjectId;
    }

    config.pubsub_provider.createSubscription(subscription, function(err) {
        if (err) callback(err);

        if (subscription.permanent)
            subscription.save(callback);
        else
            callback(null, subscription);
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
    findOne(subscription, function(err, existingSubscription) {
        if (err) return callback(err);
        if (existingSubscription) return callback(null, existingSubscription);

        create(subscription, callback);
    });
};

var publish = function(type, item, callback) {
    if (!config.pubsub_provider) return log.error("subscriptions: can't publish without pubsub_provider");

    log.info("subscriptions: publishing " + type + ": " + item.id + ": " + JSON.stringify(item));
    config.pubsub_provider.publish(type, item, callback);
};

var remove = function(subscription, callback) {
    log.info('subscriptions: removing subscription: ' + subscription.id);
    config.pubsub_provider.removeSubscription(subscription, function(err) {
        if (err) return callback(err);

        if (subscription.permanent)
            subscription.remove(callback);
    });
};

var save = function(subscription, callback) {
    subscription.save(callback);
};

module.exports = {
    attach: attach,
    create: create,
    findOrCreate: findOrCreate,    
    publish: publish
};
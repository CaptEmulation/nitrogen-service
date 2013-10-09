var async = require('async')
  , config = require('../config')
  , log = require('../log')
  , models = require('../models')
  , mongoose = require('mongoose')
  , services = require('../services')
  , sift = require('sift')
  , utils = require('../utils');

var io;
var subscriptions = {};

var attach = function(server) {
    if (!config.pubsub_provider) return log.info('pubsub provider not configured: subscription endpoint not started.');

    io = require('socket.io').listen(server);

    io.set('log level', 1);

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
        if (!socket.handshake.principal) return log.error('subscription request without type and/or principal.');

        socket.subscriptions = {};
        socket.on('start', function(spec) {
            start(socket, spec);
        });

        socket.on('disconnect', function() {
            log.info('subscriptions: socket: ' + socket.id + ' disconnected.  removing all subscriptions on this socket.');

            async.each(Object.keys(socket.subscriptions), function(clientId, callback) {
                remove(socket.subscriptions[clientId], callback);
            });
        });

        socket.on('stop', function(spec) {
            remove(socket.subscriptions[spec.id], function(err) {
                if (err) log.error(err);
            });
        });

        // TODO: add ability to create messages through the socket connection.
        //socket.on('message', function(message) {});
    });
};

var create = function(subscription, callback) {
    subscription.permanent = !!subscription.name;
    if (!subscription.permanent) {
        // assign a random name and id if this is a non-permanent subscription.
        subscription.id = subscription.name = new mongoose.Types.ObjectId();
    }

    config.pubsub_provider.createSubscription(subscription, function(err) {
        if (err) callback(err);

        subscriptions[subscription.clientId] = subscription;

        // we only save permanent subscriptions to the db, not session ones.
        if (subscription.permanent)
            save(subscription, callback);
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
    async.each(Object.keys(subscriptions), function(subscriptionId, eachCallback) {
        
        var subscription = subscriptions[subscriptionId];

        if (subscription.type === type && subscription.callback) {
            sift(subscription.filter, [item]).forEach(function(unfiltered) {
                config.pubsub_provider.publish(subscription, item, callback);
            });
        }

        eachCallback();

    }, callback);
};

var remove = function(subscription, callback) {
    if (!subscription) return log.error('undefined subscription passed to services.subscription.remove.');

    log.info('subscriptions: removing subscription: ' + subscription.id + ': ' + subscription.clientId);

    config.pubsub_provider.removeSubscription(subscription, function(err) {
        if (err) return callback(err);

        delete subscriptions[subscription.clientId];
        delete subscription.socket.subscriptions[subscription.clientId];

        if (subscription.permanent)
            subscription.remove(callback);
        else
            callback();
    });
};

var save = function(subscription, callback) {
    subscription.save(callback);
};

var start = function(socket, spec) {
    var subscription = new models.Subscription({
        clientId: spec.id,
        filter: spec.filter || {},
        name: spec.name,
        principal: socket.handshake.principal.id,
        socket: socket,
        type: spec.type
    });

    // compose filter that includes visibility limitations.

    // TODO: this assumes messages are the only type of subscription.
    subscription.filter = services.messages.filterForPrincipal(socket.handshake.principal, subscription.filter);

    findOrCreate(subscription, function(err, subscription) {
        if (err) return log.error('subscriptions: failed to create: ' + err);

        log.info('subscriptions: connecting subscription: ' + subscription.id);

        socket.subscriptions[spec.id] = subscription;
        socket.emit('ready');

        stream(socket, subscription);
    });
};

var stream = function(socket, subscription) {
    async.whilst(
        function() { return socket.subscriptions[subscription.clientId] !== undefined; },
        function(callback) {
            config.pubsub_provider.receive(subscription, function(err, item) {
                if (err) return callback(err);

                // there might not be an item when the pubsub_provider's timed out waiting for an item.
                // in this case, we just need to check that we are still connected and restart the receive.

                if (item) {
                    console.log('subscriptions:  new message from subscription: ' + subscription.clientId + ' of type: ' + subscription.type + ": " + JSON.stringify(item));
                    socket.emit(subscription.clientId, item);
                }

                callback();
            });
        },
        function(err) {
            if (err) log.error(err);

            console.log("subscriptions: stream for " + subscription.clientId + " disconnected.");
        }
    );
};

module.exports = {
    attach: attach,
    create: create,
    findOrCreate: findOrCreate,
    publish: publish
};

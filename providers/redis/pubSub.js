var async = require('async')
  , log = require('../../log')
  , redis = require('redis')
  , sift = require('sift');

function RedisPubSubProvider(config) {
    this.config = config;
    this.clients = {};
}

RedisPubSubProvider.SUBSCRIPTIONS_KEY = 'pubsub.subscriptions';
RedisPubSubProvider.DEFAULT_RECEIVE_TIMEOUT = 60;

RedisPubSubProvider.subscriptionKey = function(subscription) {
    return subscription.id;
};

RedisPubSubProvider.prototype.clientForServer = function(serverId) {
    if (!this.clients[serverId] ) {
        this.clients[serverId]  = this.createClient(serverId);
    }

    return this.clients[serverId];
};

RedisPubSubProvider.prototype.createClient = function(serverId) {
    var server = this.config.redis_servers[serverId];
    return redis.createClient(server.port, server.host);
};

RedisPubSubProvider.prototype.createSubscription = function(subscription, callback) {   
    // TODO: choose server based on subscription load not randomly.
    var serverIds = Object.keys(this.config.redis_servers);
    var serverAssignmentIdx = Math.floor(serverIds.length * Math.random());

    subscription.serverId = serverIds[serverAssignmentIdx];

    var client = this.clientForServer(subscription.serverId);
    client.sadd(RedisPubSubProvider.SUBSCRIPTIONS_KEY, JSON.stringify(subscription), function(err) {
        return callback(err, subscription);
    });
};

RedisPubSubProvider.prototype.publish = function(type, item, callback) {
    log.info("subscriptions: publishing " + type + ": " + item.id + ": " + JSON.stringify(item));
    var self = this;

    // iterate over each redis server

    async.each(Object.keys(this.config.redis_servers), function(serverId, serverCallback) {
        
        // find all of the subscriptions for this server
        var client = self.clientForServer(serverId);
        client.smembers('pubsub.subscriptions', function(err, subscriptions) {
            if (err) return serverCallback(err);

            // for each subscription, see if the filter matches this item
            async.each(subscriptions, function(subscriptionJson, subscriptionCallback) {
                var subscription = JSON.parse(subscriptionJson);
                if (subscription.type === type) {
                    var unfilteredItems = sift(subscription.filter, [item]);
                    if (unfilteredItems.length > 0) {
                        client.rpush(RedisPubSubProvider.subscriptionKey(subscription), JSON.stringify(unfilteredItems[0]), subscriptionCallback);
                    } else {
                        return subscriptionCallback();
                    }
                } else {
                    return subscriptionCallback();                    
                }
            }, serverCallback);
        });

    }, callback);
};

RedisPubSubProvider.prototype.receive = function(subscription, callback) {
    var client = this.createClient(subscription.serverId);

    client.on('error', callback);
    client.blpop(RedisPubSubProvider.subscriptionKey(subscription), RedisPubSubProvider.DEFAULT_RECEIVE_TIMEOUT, function(err, reply) {
        if (err) return callback(err);
        if (!reply) return callback(null, null);

        // redis returns an 2 element array with [key, value], so decode this
        var item = JSON.parse(reply[1]);

        return callback(null, item);
    });
};

RedisPubSubProvider.prototype.removeSubscription = function(subscription, callback) {
    var client = this.clientForServer(subscription.serverId);
    client.srem(RedisPubSubProvider.SUBSCRIPTIONS_KEY, subscription, callback);
};

RedisPubSubProvider.prototype.resetForTest = function(callback) {
    if (process.env.NODE_ENV === "production") return callback();

    log.info('redis pubsub provider: resetting Redis store completely for test');

    var client = this.clientForServer(Object.keys(this.config.redis_servers)[0]);
    client.flushdb(callback);
};

module.exports = RedisPubSubProvider;

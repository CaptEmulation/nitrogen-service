var async = require('async')
  , log = require('../../log');

function MemoryPubSubProvider() {
    this.subscriptions = {};
}

MemoryPubSubProvider.prototype.createSubscription = function(subscription, callback) {
    this.subscriptions[subscription.id] = subscription;

    return callback();
};

MemoryPubSubProvider.prototype.publish = function(type, item, callback) {
    var self = this;
    async.each(Object.keys(this.subscriptions), function(subscriptionId, cb) {
        
        var subscription = self.subscriptions[subscriptionId];
        if (subscription && subscription.type === type && subscription.callback) {
            log.info('memory pubsub provider publishing to subscription: ' + subscription.id + ' item: ' + JSON.stringify(item));
            subscription.callback(null, item);
        }

        cb();

    }, callback);
};

MemoryPubSubProvider.prototype.receive = function(subscription, callback) {
    subscription.callback = callback;
};

MemoryPubSubProvider.prototype.removeSubscription = function(subscription, callback) {
    delete this.subscriptions[subscription.id];
};

module.exports = MemoryPubSubProvider;
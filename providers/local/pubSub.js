var async = require('async')
  , log = require('../../log')
  , sift = require('sift');

function MemoryPubSubProvider() {
    this.subscriptions = {};
}

MemoryPubSubProvider.prototype.createSubscription = function(subscription, callback) {
    this.subscriptions[subscription.id] = subscription;

    return callback();
};

MemoryPubSubProvider.prototype.publish = function(type, item, callback) {
    var self = this;
    async.each(Object.keys(this.subscriptions), function(subscriptionId, eachCallback) {
        
        var subscription = self.subscriptions[subscriptionId];

        if (subscription.type === type && subscription.callback) {
            sift(subscription.filter, [item]).forEach(function(unfiltered) {
                log.info('memory pubsub provider publishing to subscription: ' + subscription.id + ' item: ' + JSON.stringify(unfiltered));
                subscription.callback(null, unfiltered);
            });
        }

        eachCallback();

    }, callback);
};

MemoryPubSubProvider.prototype.receive = function(subscription, callback) {
    subscription.callback = callback;
};

MemoryPubSubProvider.prototype.removeSubscription = function(subscription, callback) {
    delete this.subscriptions[subscription.id];
};

module.exports = MemoryPubSubProvider;
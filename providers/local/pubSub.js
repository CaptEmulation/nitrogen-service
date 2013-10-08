var async = require('async')
  , log = require('../../log');

function MemoryPubSubProvider() {
}

MemoryPubSubProvider.prototype.createSubscription = function(subscription, callback) {
    callback();
};

MemoryPubSubProvider.prototype.publish = function(subscription, item, callback) {
    subscription.callback(null, item);
};

MemoryPubSubProvider.prototype.receive = function(subscription, callback) {
    subscription.callback = callback;
};

MemoryPubSubProvider.prototype.removeSubscription = function(subscription, callback) {
    callback();
};

module.exports = MemoryPubSubProvider;
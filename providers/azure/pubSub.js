var async = require('async')
  , azure = require('azure')
  , log = require('../../log');

function AzurePubSubProvider() {
    if (!process.env.AZURE_SERVICEBUS_NAMESPACE || !process.env.AZURE_SERVICEBUS_ACCESS_KEY) {
        return log.warn("WARNING: Azure service bus namespace or access key not configured.  Set AZURE_SERVICEBUS_NAMESPACE and AZURE_SERVICEBUS_ACCESS_KEY as environment variables to configure the azure pub sub provider.");
    }

    this.serviceBus = azure.createServiceBusService();
    var self = this;

    async.each(['messages', 'principals'], function(topic, callback) {
        self.serviceBus.createTopicIfNotExists(topic, callback);
    }, function(err) {
        if (err) return log.error("Azure PubSub Provider: Not able to create/confirm service bus topics: " + err);
    });
}

AzurePubSubProvider.prototype.createSubscription = function(subscription, callback) {
    this.serviceBus.createSubscription(subscription.type, subscription.name, function(err) {
        if (err) return callback(err);

        // TODO: add filtering for subscriptions
        // rule.create();

        return callback();
    });
};

AzurePubSubProvider.prototype.publish = function(type, item, callback) {
    this.serviceBus.sendTopicMessage(type, JSON.stringify(item), callback);
};

AzurePubSubProvider.prototype.receive = function(subscription, callback) {
    this.serviceBus.receiveSubscriptionMessage(
        subscription.type,
        subscription.name,
        { timeoutIntervalInS: 5 * 60 },
        function (err, item) {
            if (err) {
                // squelch non error error from Azure.
                if (err === 'No messages to receive') err = null;
                callback(err);
            }
            else {
                callback(null, JSON.parse(item.body));
            }
        }
    );
};

AzurePubSubProvider.prototype.removeSubscription = function(subscription, callback) {
    this.serviceBus.deleteSubscription(subscription.type, subscription.name, callback);
};

module.exports = AzurePubSubProvider;

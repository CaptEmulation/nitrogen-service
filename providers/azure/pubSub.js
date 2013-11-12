var async = require('async')
  , azure = require('azure')
  , log = require('../../log');

function AzurePubSubProvider() {
    if (!process.env.AZURE_SERVICEBUS_NAMESPACE || !process.env.AZURE_SERVICEBUS_ACCESS_KEY) {
        return log.warn("WARNING: Azure service bus namespace or access key not configured.  Set AZURE_SERVICEBUS_NAMESPACE and AZURE_SERVICEBUS_ACCESS_KEY as environment variables to configure the azure pub sub provider.");
    }

    var retryOperations = new azure.ExponentialRetryPolicyFilter();

    this.serviceBus = azure.createServiceBusService().withFilter(retryOperations);
    this.serviceBus.createTopicIfNotExists('message', function(err) {
        if (err) return log.error("Azure PubSub Provider: Not able to create/confirm service bus topics: " + err);
    });
}

// sample JSON query
// {
//    "$and": [
//        { "type": "cameraCommand" },
//        { "$or": [
//                {"public":true},
//                {"visible_to":"5279287eb876269422000018"}
//          ]
//        }
//    ],
//    { "foo": "bar"}
// }

AzurePubSubProvider.buildFromSubArray = function(array, operation) {
    var subqueries = [];
    array.forEach(function(element) {
        subqueries.push(AzurePubSubProvider.sqlFromJsonQuery(element));        
    });

    return "(" + subqueries.join(operation) + ")";
};

AzurePubSubProvider.sqlFromJsonQuery = function(jsonQuery) {
    var subqueries = [];
    for (var key in jsonQuery) {
        if (key === "$and") {
            subqueries.push(AzurePubSubProvider.buildFromSubArray(jsonQuery[key], " AND "));
        } else if (key === "$or") {
            subqueries.push(AzurePubSubProvider.buildFromSubArray(jsonQuery[key], " OR "));
        } else {
            var value = JSON.stringify(jsonQuery[key]).replace(/"/g, "'");
            subqueries.push(key + '=' + value);
        }

    }

    if (subqueries.length > 0)
        return "(" + subqueries.join(" AND ") + ")";
    else
        return "";
};

AzurePubSubProvider.prototype.createSubscription = function(subscription, callback) {
    var self = this;    
    log.info('AzurePubSubProvider:creating subscription for type: ' + subscription.type + ' with name: ' + subscription.fullyQualifiedName());
    this.serviceBus.createSubscription(subscription.type, subscription.fullyQualifiedName(), function(err) {
        if (err) {
            // non error - already exists.
            log.error(JSON.stringify(err));
            if (err.detail && err.detail.indexOf('already exists') !== -1)
                return callback();
            else
                return callback(err);
        }

        if (subscription.filter) {

            self.serviceBus.deleteRule(
                subscription.type, 
                subscription.fullyQualifiedName(), 
                azure.Constants.ServiceBusConstants.DEFAULT_RULE_NAME,
                function(err) {
                    if (err) return callback(err);

                    self.serviceBus.createRule(
                        subscription.type, 
                        subscription.fullyQualifiedName(), 
                        subscription.fullyQualifiedName() + "_filter", {
                            sqlExpressionFilter: AzurePubSubProvider.sqlFromJsonQuery(subscription.filter)
                        },

                        callback
                    );  
                }
            );
        } else {
            return callback();
        }
    });
};

AzurePubSubProvider.prototype.publish = function(type, item, callback) {
    log.info("AzurePubSubProvider: publishing " + type + ": " + item.id + ": " + JSON.stringify(item));

    var serviceBusMessage = {
        customProperties: item.toObject(),
        body: JSON.stringify(item)
    };

    this.serviceBus.sendTopicMessage(type, serviceBusMessage, callback);
};

AzurePubSubProvider.prototype.receive = function(subscription, callback) {
    this.serviceBus.receiveSubscriptionMessage(
        subscription.type,
        subscription.fullyQualifiedName(),
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
    this.serviceBus.deleteSubscription(subscription.type, subscription.fullyQualifiedName(), callback);
};

module.exports = AzurePubSubProvider;
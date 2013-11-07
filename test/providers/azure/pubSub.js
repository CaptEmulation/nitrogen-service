var assert = require('assert')
  , config = require('../../../config')
  , fixtures = require('../../fixtures')
  , models = require('../../../models')
  , providers = require('../../../providers')
  , services = require('../../../services')
  , utils = require('../../../utils');

if (process.env.AZURE_SERVICEBUS_NAMESPACE && process.env.AZURE_SERVICEBUS_ACCESS_KEY) {
    var pubsub = new providers.azure.AzurePubSubProvider(config);

    describe('Azure Service Bus pubsub provider', function() {
        it('can build sql queries from json queries', function(done) {
            var jsonQuery1 = {
                "foo": "bar",
                "fee": "foo"
            };

            var sqlQuery1 = providers.azure.AzurePubSubProvider.sqlFromJsonQuery(jsonQuery1);
            assert.equal(sqlQuery1, "(foo='bar' AND fee='foo')");

            var jsonQuery2 = {
                "$and": [
                    { "type": "cameraCommand" },
                    { "$or": [
                            {"public":true},
                            {"visible_to":"xyz"}
                      ]
                    }
               ],
               "foo": "bar"
            };

            var sqlQuery2 = providers.azure.AzurePubSubProvider.sqlFromJsonQuery(jsonQuery2);
            assert.equal(sqlQuery2, "(((type='cameraCommand') AND (((public=true) OR (visible_to='xyz')))) AND foo='bar')");

            var jsonQuery3 = {};
            var sqlQuery3 = providers.azure.AzurePubSubProvider.sqlFromJsonQuery(jsonQuery3);
            assert.equal(sqlQuery3, '');

            done();
        });

        it('can create a subscription and receive messages from it', function(done) {
            var subscription = new models.Subscription({
                clientId: "fakeclientid",
                filter: { type: 'ip' },
                name: 'matcher',
                principal: services.principals.servicePrincipal,
                type: 'messages'
            });

            pubsub.removeSubscription(subscription, function(err) {
                pubsub.createSubscription(subscription, function(err, createruleresult, response) {
                    assert.ifError(err);

                    var publishFinished;
                    pubsub.receive(subscription, function(err, message) {
                        assert.ifError(err);
                        assert.notEqual(message, undefined);
                        assert.equal(message.type, 'ip');

                        var totalTime = new Date().getTime() - publishFinished.getTime();
                        assert(totalTime < 200);

                        done();
                    });

                    var filteredMessage = new models.Message({
                        from: fixtures.models.principals.device.id,
                        type: "_test",
                        body: { reading: 5.1 }
                    });

                    var startPublish = new Date();

                    pubsub.publish('messages', filteredMessage, function(err) {
                        assert.ifError(err);
                        publishFinished = new Date();

                        var totalTime = publishFinished.getTime() - startPublish.getTime();
                        assert(totalTime < 800);

                        var message = new models.Message({
                            from: fixtures.models.principals.device.id,
                            type: "ip",
                            body: { ip_address: "127.0.0.1" }
                        });

                        pubsub.publish('messages', message, function(err) {
                            publishFinished = new Date();
                            assert.ifError(err);
                        });
                    });
                });
            });

        });
    })
}
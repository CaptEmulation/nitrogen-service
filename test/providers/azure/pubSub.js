var assert = require('assert')
  , config = require('../../../config')
  , fixtures = require('../../fixtures')
  , log = require('../../../log')
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
                name: 'testSubscription',
                principal: services.principals.servicePrincipal,
                type: 'message'
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
                        //assert(totalTime < 200);

                        done();
                    });

                    var filteredMessage = new models.Message({
                        from: fixtures.models.principals.device.id,
                        type: "_test",
                        body: { reading: 5.1 }
                    });

                    var startPublish = new Date();

                    pubsub.publish('message', filteredMessage, function(err) {
                        assert.ifError(err);
                        publishFinished = new Date();

                        var totalTime = publishFinished.getTime() - startPublish.getTime();
                        //assert(totalTime < 800);

                        var message = new models.Message({
                            from: fixtures.models.principals.device.id,
                            type: "ip",
                            body: { ip_address: "127.0.0.1" }
                        });

                        pubsub.publish('message', message, function(err) {
                            publishFinished = new Date();
                            assert.ifError(err);
                        });
                    });
                });
            });

        });

        it('permanent subscriptions should queue messages for later', function(done) {
            var subscription = new models.Subscription({
                filter: { type: '_permanentQueueTest' },
                name: 'permanent',
                principal: services.principals.servicePrincipal.id,
                type: 'message'
            });

            services.subscriptions.findOrCreate(subscription, function(err, subscription) {
                assert.ifError(err);
                assert(subscription.permanent);

                var msg = new models.Message({
                    type: '_permanentQueueTest',
                    from: services.principals.servicePrincipal.id,
                    body: {
                        seq: 1
                    }
                });

                // create a message
                services.messages.create(services.principals.servicePrincipal, msg, function(err) {
                    assert.ifError(err);

                    // create a 2nd message
                    msg.body.seq = 2;
                    services.messages.create(services.principals.servicePrincipal, msg, function(err) {
                        assert.ifError(err);

                        // receive messages and make sure we get both and in order.
                        services.subscriptions.receive(subscription, function(err, message) {
                            assert.ifError(err);
                            console.dir(message);
                            assert.equal(message.body.seq, 1);

                            services.subscriptions.receive(subscription, function(err, message) {
                                assert.ifError(err);
                                assert.equal(message.body.seq, 2);

                                done();
                            });
                        });
                    });
                })
            })
        });
    });
}
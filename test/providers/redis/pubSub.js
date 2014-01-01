var assert = require('assert')
  , config = require('../../../config')
  , fixtures = require('../../fixtures')
  , log = require('../../../log')
  , models = require('../../../models')
  , providers = require('../../../providers')
  , services = require('../../../services')
  , utils = require('../../../utils');

if (config.pubsub_provider instanceof providers.redis.RedisPubSubProvider) {
    describe('Redis pubsub provider', function() {

        it('can create a session subscription and receive messages from it', function(done) {
            var subscription = new models.Subscription({
                clientId: "fakeclientid",
                filter: { type: 'ip' },
                principal: services.principals.servicePrincipal,
                type: 'message'
            });

            config.pubsub_provider.createSubscription(subscription, function(err, subscription) {
                assert.ifError(err);

                var publishFinished;
                config.pubsub_provider.receive(subscription, function(err, message) {
                    assert.ifError(err);
                    assert.notEqual(message, undefined);
                    assert.equal(message.type, 'ip');

                    //var totalTime = new Date().getTime() - publishFinished.getTime();
                    //assert(totalTime < 200);

                    config.pubsub_provider.subscriptionsForServer(subscription.serverId, function(err, subscriptions) {
                        assert.ifError(err);
                        var startingSubscriptions = subscriptions.length;

                        config.pubsub_provider.removeSubscription(subscription, function(err) {
                            assert.ifError(err);

                            config.pubsub_provider.subscriptionsForServer(subscription.serverId, function(err, subscriptions) {
                                assert.ifError(err);

                                assert.equal(1, startingSubscriptions - subscriptions.length);
                                done();
                            });
                        });
                    });
                });

                var message = new models.Message({
                    from: fixtures.models.principals.device.id,
                    type: "_test",
                    body: { reading: 5.1 }
                });

                var startPublish = new Date();

                config.pubsub_provider.publish('message', message, function(err) {
                    assert.ifError(err);
                    publishFinished = new Date();

                    //var totalTime = publishFinished.getTime() - startPublish.getTime();
                    //assert(totalTime < 800);

                    var message = new models.Message({
                        from: fixtures.models.principals.device.id,
                        type: "ip",
                        body: { ip_address: "127.0.0.1" }
                    });

                    config.pubsub_provider.publish('message', message, function(err) {
                        publishFinished = new Date();
                        assert.ifError(err);
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

                            assert.equal(message.body.seq, 1);
                            assert.equal(message.type, '_permanentQueueTest');

                            services.subscriptions.receive(subscription, function(err, message) {
                                assert.ifError(err);
                                assert.equal(message.body.seq, 2);
                                assert.equal(message.type, '_permanentQueueTest');
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

}

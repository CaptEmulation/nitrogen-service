var assert = require('assert')
  , config = require('../../config')
  , fixtures = require('../fixtures')
  , models = require('../../models')
  , services = require('../../services');

describe('agent service', function() {

    it('matches 1 user and 1 device', function(done) {
        services.principals.initialize(function(err) {
            assert.ifError(err);
            assert.notEqual(services.principals.systemPrincipal, null);

            services.agents.initialize(config, function(err, session, compiledAgents) {
                assert.ifError(err);
                assert.equal(compiledAgents.length > 0, true);

                services.agents.execute(compiledAgents, fixtures.models.messages.deviceIp, function(err, contexts) {
                    assert.ifError(err);

                    setTimeout(function() {
                        services.messages.find({ message_type: "ip_match" }, {}, function(err, messages) {
                            assert.ifError(err);
                            assert.equal(messages.length > 0, true);
                            done();
                        });
                    }, 700);
                });
            });
        });
    });

});

var assert = require('assert')
  , config = require('../../config')
  , fixtures = require('../fixtures')
  , models = require('../../models')
  , services = require('../../services');

describe('agent service', function() {

    it('deviceMatching matches 1 user and 1 device', function(done) {

        services.principals.updateLastConnection(fixtures.models.principals.user, "127.0.0.1");

        setTimeout(function() {
            services.messages.find(services.principals.systemPrincipal, { type: "ip_match" }, {}, function(err, messages) {
                assert.ifError(err);
                assert.equal(messages.length > 0, true);
                done();
            });
        }, 200);

    });

    it('deviceMatching does not match 2 users at same ip address for 2nd user', function(done) {
        services.principals.updateLastConnection(fixtures.models.principals.user, "127.0.0.1");
        services.principals.updateLastConnection(fixtures.models.principals.anotherUser, "127.0.0.1");

        setTimeout(function() {
            services.messages.find(services.principals.systemPrincipal,
                                   { type: "ip_match",
                                     to: fixtures.models.principals.anotherUser.id }, {}, function(err, messages) {
                assert.ifError(err);
                assert.equal(messages.length > 0, false);
                done();
            });
        }, 200);

    });

    it('claiming a device changes the owner', function(done) {
        services.principals.updateLastConnection(fixtures.models.principals.user, "127.0.0.1");

        // wait for matcher agent to match the user and device ip addresses.
        setTimeout(function() {
            services.messages.find(services.principals.systemPrincipal, { type: "ip_match" }, {}, function(err, messages) {
                assert.ifError(err);
                assert.equal(messages.length > 0, true);

                var ipMatch = messages[0];

                var claimMessage = models.Message({
                    type: 'claim',
                    response_to: ipMatch.id,
                    from: fixtures.models.principals.user.id,
                    to: services.principals.systemPrincipal.id,
                    body: {
                        principal: ipMatch.body.principal
                    }
                });

                services.messages.create(claimMessage, function(err, message) {
                    assert.ifError(err);

                    // wait for claim agent to assign the device to the user.
                    setTimeout(function() {
                        services.principals.findById(services.principals.systemPrincipal, ipMatch.body.principal, function(err, principal) {
                            assert.ifError(err);
                            assert.equal(principal.owner, fixtures.models.principals.user.id);
                            done();
                        });
                    }, 200);
                });
            });
        }, 200);

    });

});

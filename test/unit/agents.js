var assert = require('assert')
  , config = require('../../config')
  , fixtures = require('../fixtures')
  , models = require('../../models')
  , services = require('../../services');

describe('agent service', function() {

    it('matcher automatically matches case where 1 user and 1 device are at same ip', function(done) {

        services.principals.updateLastConnection(fixtures.models.principals.user, "127.0.0.1");

        setTimeout(function() {
            services.principals.findById(services.principals.systemPrincipal, fixtures.models.principals.device.id, function(err, principal) {
                assert.ifError(err);
                assert.equal(principal.owner, fixtures.models.principals.user.id);
                done();
            });
        }, 200);

    });

    it('matcher does not match 2 users at same ip address for 2nd user', function(done) {
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

});

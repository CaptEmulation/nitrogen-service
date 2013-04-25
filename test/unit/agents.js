var assert = require('assert')
  , config = require('../../config')
  , fixtures = require('../fixtures')
  , models = require('../../models')
  , services = require('../../services');

describe('agent service', function() {

    it('deviceMatching matches 1 user and 1 device', function(done) {

        services.principals.updateLastConnection(fixtures.models.principals.user, "127.0.0.1");

        setTimeout(function() {
            services.messages.find(services.principals.systemPrincipal, { message_type: "ip_match" }, {}, function(err, messages) {
                assert.ifError(err);
                assert.equal(messages.length > 0, true);
                done();
            });
        }, 100);

    });

    it('deviceMatching does not match 2 users at same ip address for 2nd user', function(done) {

        services.principals.updateLastConnection(fixtures.models.principals.user, "127.0.0.1");
        services.principals.updateLastConnection(fixtures.models.principals.anotherUser, "127.0.0.1");

        setTimeout(function() {
            services.messages.find(services.principals.systemPrincipal,
                                   { message_type: "ip_match",
                                     to: fixtures.models.principals.anotherUser.id }, {}, function(err, messages) {
                assert.ifError(err);
                assert.equal(messages.length > 0, false);
                done();
            });
        }, 100);

    });

});

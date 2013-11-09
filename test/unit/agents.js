var assert = require('assert')
  , config = require('../../config')
  , fixtures = require('../fixtures')
  , log = require('../../log')
  , models = require('../../models')
  , services = require('../../services');

describe('agent service', function() {

    it('matcher automatically matches case where 1 user and 1 device are at same ip', function(done) {
        services.principals.updateLastConnection(fixtures.models.principals.user, "127.0.0.1");

        setTimeout(function() {
            services.permissions.authorize({
                principal: fixtures.models.principals.user,
                principal_for: fixtures.models.principals.device,
                action: 'view'
            }, {}, function(err, permission) {
                assert.ifError(err);
                assert(permission.authorized);

                // user has view permission to see device
                services.principals.find(fixtures.models.principals.user, { _id: fixtures.models.principals.device.id }, {}, function(err, principals) {
                    assert.ifError(err);
                    assert.equal(principals.length, 1);

                    done();
                });
            });
        }, 200);
    });

    it('matcher does not match 2 users at same ip address for 2nd user', function(done) {
        services.permissions.remove(services.principals.servicePrincipal, {
            issued_to: fixtures.models.principals.user.id,
            principal_for: fixtures.models.principals.device.id
        }, function(err, removed) {
            assert.ifError(err);

            services.principals.updateLastConnection(fixtures.models.principals.user, "127.0.0.1");
            services.principals.updateLastConnection(fixtures.models.principals.anotherUser, "127.0.0.1");

            setTimeout(function() {
                services.permissions.authorize({
                    principal: fixtures.models.principals.user,
                    principal_for: fixtures.models.principals.device,
                    action: 'admin'
                }, {}, function(err, permission) {
                    assert.ifError(err);
                    assert.equal(permission.authorized, false);
                    done();
                });
            }, 200);
        });
    });

    it('claim agent can claim devices', function(done) {
       services.permissions.remove(services.principals.servicePrincipal, {
            issued_to: fixtures.models.principals.user.id,
            principal_for: fixtures.models.principals.device.id
        }, function(err, removed) {
            assert.ifError(err);

            services.principals.update(services.principals.servicePrincipal, fixtures.models.principals.device.id, { claim_code: 'TAKE-1234' }, function(err, principal) {
                assert.equal(principal.claim_code, 'TAKE-1234');

                var claim = new models.Message({
                    type: 'claim',
                    from: fixtures.models.principals.user.id,
                    to: services.principals.servicePrincipal.id,
                    body: {
                        claim_code: 'TAKE-1234'
                    }
                });

                services.messages.create(fixtures.models.principals.user, claim, function(err, message) {
                    setTimeout(function() {
                        services.permissions.authorize({
                            principal: fixtures.models.principals.user,
                            principal_for: fixtures.models.principals.device,
                            action: 'admin'
                        }, {}, function(err, permission) {
                            assert.ifError(err);
                            assert(permission.authorized);
                            done();
                        });
                    }, 200);
                });
            });
        });
    });
});

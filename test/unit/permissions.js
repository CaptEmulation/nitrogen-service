var assert = require('assert')
  , config = require('../../config')
  , fixtures = require('../fixtures')
  , models = require('../../models')
  , nitrogen = require('nitrogen')
  , services = require('../../services');

describe('permissions service', function() {
    it('checks default permissions', function(done) {
        var message = new nitrogen.Message({
            type: 'ip'
        });

        services.permissions.authorize({
            principal: services.principals.servicePrincipal,
            action: 'send'
        }, message, function(err, permission) {
            assert.ifError(err);
            assert.equal(permission.authorized, true);

            services.permissions.authorize({
                principal: fixtures.models.principals.user,
                action: 'send'
            }, message, function(err, permission) {
                assert.ifError(err);
                assert.equal(permission.authorized, false);

                message.type = 'image';
                message.body.url = 'http://to.no.where/';

                services.permissions.authorize({
                    principal: fixtures.models.principals.user,
                    action: 'send'
                }, message, function(err, permission) {
                    assert.ifError(err);
                    assert.equal(permission.authorized, true);

                    message.to = fixtures.models.principals.device.id;
                    services.permissions.authorize({
                        principal: fixtures.models.principals.user,
                        action: 'send'
                    }, message, function(err, permission) {
                        assert.ifError(err);
                        assert.equal(permission.authorized, false);
                        done();
                    });                    
                });
            });
        });
    });

    it('creating a permission updates visible_to', function(done) {
        services.principals.findById(services.principals.servicePrincipal, fixtures.models.principals.anotherUser.id, function(err, anotherUser) {
            services.permissions.create(services.principals.servicePrincipal,        
                new models.Permission({
                    authorized: true,
                    issued_to: fixtures.models.principals.user.id,
                    principal_for: fixtures.models.principals.anotherUser.id,
                    priority: 50000000
                }),
                function(err, permission) {
                    assert.ifError(err);

                    services.principals.findById(services.principals.servicePrincipal, fixtures.models.principals.anotherUser.id, function(err, anotherUser) {
                        assert.ifError(err);

                        var foundUser = false;
                        anotherUser.visible_to.forEach(function(visiblePrincipalId) {
                            if (visiblePrincipalId.toString() === fixtures.models.principals.user.id)
                                foundUser = true;
                        });

                        assert(foundUser);
                        done();
                    });
                }
            );
        });
    });

});

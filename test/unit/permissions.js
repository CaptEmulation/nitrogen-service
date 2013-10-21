var assert = require('assert')
  , config = require('../../config')
  , fixtures = require('../fixtures')
  , nitrogen = require('nitrogen')
  , services = require('../../services');

describe('permissions service', function() {
    it('checks default permissions', function(done) {
        var message = new nitrogen.Message({
            type: 'ip'
        });

        services.permissions.authorize(services.principals.servicePrincipal, null, 'send', message, function(err, permission) {
            assert.ifError(err);
            assert.equal(permission.authorized, true);

            services.permissions.authorize(fixtures.models.principals.user, null, 'send', message, function(err, permission) {
                assert.ifError(err);
                assert.equal(permission.authorized, false);

                message.type = 'image';
                message.body.url = 'http://to.no.where/';

                services.permissions.authorize(fixtures.models.principals.user, null, 'send', message, function(err, permission) {
                    assert.ifError(err);
                    assert.equal(permission.authorized, true);

                    message.to = fixtures.models.principals.device.id;
                    services.permissions.authorize(fixtures.models.principals.user, null, 'send', message, function(err, permission) {
                        assert.ifError(err);
                        assert.equal(permission.authorized, false);
                        done();
                    });                    
                });
            });
        });
    });
});

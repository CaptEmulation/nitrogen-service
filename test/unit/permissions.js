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

        services.permissions.authorize(services.principals.servicePrincipal, 'send', message, function(err) {
            assert.equal(err, undefined);

            services.permissions.authorize(fixtures.models.principals.user, 'send', message, function(err) {
                assert.notEqual(err, undefined);

                message.type = 'image';
                message.body.url = 'http://to.no.where/';
                services.permissions.authorize(fixtures.models.principals.user, 'send', message, function(err) {
                    assert.equal(err, undefined);

                    done();                    
                });
            });
        });
    });
});
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

        var result = services.permissions.authorized(services.principals.servicePrincipal, 'send', message);
        assert.equal(result, true);

        var result = services.permissions.authorized(fixtures.models.principals.user, 'send', message);
        assert.equal(result, false);

        message.type = 'image';
        message.body.url = 'http://to.no.where/';
        var result = services.permissions.authorized(fixtures.models.principals.user, 'send', message);
        assert.equal(result, true);

        done();
    });
});
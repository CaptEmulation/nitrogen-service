var assert = require('assert')
  , config = require('../../config')
  , fixtures = require('../fixtures')
  , services = require('../../services');

describe('accessToken service', function() {
    it('can create and remove tokens', function(done) {
        services.accessTokens.create(fixtures.models.principals.anotherUser, function(err, accessToken) {
            services.accessTokens.remove({ _id: accessToken.id }, function(err, removed) {
                assert.ifError(err);
                assert.equal(removed, 1);
                done();
            });
        });
    });
});
var assert = require('assert')
  , config = require('../../config')
  , request = require('request')
  , utils = require('../../utils');

describe('headwaiter endpoint', function() {
    it('should return service endpoints json', function(done) {
        request.get({url: config.headwaiter_uri, json: true}, function(err,resp,body) {
            assert.equal(resp.statusCode, 200);

            assert.notEqual(body.endpoints, undefined);
            assert.equal(utils.stringEndsWith(body.endpoints.agents_endpoint, "/agents"), true);
            assert.equal(utils.stringEndsWith(body.endpoints.messages_endpoint, "/messages"), true);
            assert.equal(utils.stringEndsWith(body.endpoints.permissions_endpoint, "/permissions"), true);
            assert.equal(utils.stringEndsWith(body.endpoints.principals_endpoint, "/principals"), true);
            assert.notEqual(body.endpoints.subscriptions_endpoint, undefined);

            done();
        });
    });
});

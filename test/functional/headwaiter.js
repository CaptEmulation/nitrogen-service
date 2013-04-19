var assert = require('assert')
  , config = require('../../config')
  , request = require('request')
  , utils = require('../../utils');

describe('headwaiter endpoint', function() {
    it('should return service endpoints json', function(done) {
        request.get({url: config.base_url + '/headwaiter', json: true}, function(err,resp,body) {
            assert.equal(resp.statusCode, 200);

            assert.notEqual(body.endpoints, undefined);
            assert.equal(utils.stringEndsWith(body.endpoints.messages_endpoint, "/messages"), true);
            assert.equal(utils.stringEndsWith(body.endpoints.principals_endpoint, "/principals"), true);

            done();
        });
    });
});
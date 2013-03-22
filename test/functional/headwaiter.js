process.env.NODE_ENV = 'test';

var assert = require('assert'),
    config = require('../../config'),
    request = require('request'),
    utils = require('../../utils');

describe('headwaiter endpoint', function() {
    it('should return service endpoints json', function(done) {
        request(config.base_url + '/headwaiter', function(err,resp,body) {
            assert.equal(resp.statusCode, 200);

            var endpointJSON = JSON.parse(body);
            assert.ok(utils.stringEndsWith(endpointJSON.blobs_endpoint, "/blobs/"));
            assert.ok(utils.stringEndsWith(endpointJSON.messages_endpoint, "/messages/"));
            assert.ok(utils.stringEndsWith(endpointJSON.principals_endpoint, "/principals/"));

            done();
        });
    });
});
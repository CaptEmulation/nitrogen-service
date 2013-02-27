process.env.NODE_ENV = 'test';

var assert = require('assert'),
	config = require('../../config'),
    request = require('request');

describe('ops endpoint', function() {

	it('should have passing health', function(done) {
		request({url: config.base_url + '/ops/health', json: true}, function(err, resp, body) {
	      assert.equal(resp.statusCode, 200);
	      assert.equal(body.status, "ok");
	      done(); 
	    });
	});

});
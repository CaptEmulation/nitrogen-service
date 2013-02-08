process.env.NODE_ENV = 'test';

var app = require('../../server'),
	assert = require('assert'),
	Config = require('../../config'),
    request = require('request');

var config = new Config();

describe('messages REST endpoint', function() {
	it('should return all messages json', function(done) {
	    request(config.base_url + '/messages', function(err,resp,body) {
	      assert.equal(resp.statusCode, 200);
	      done(); 
	    });
	});

	it('should create a message', function(done) {
		request.post(config.base_url + '/messages', 
			{ json: { timestamp: new Date(2012,1,31) } }, function(err,resp,body) {
		      assert.equal(resp.statusCode, 200);
		      assert.equal(resp.body.timestamp, new Date(2012,1,31).toISOString());
		      done(); 
	    }); 
    }); 

	it('should fetch a message', function(done) {
	    request(config.base_url + '/messages/51147ca4f47471c82f000002', function(err,resp,body) {
	      assert.equal(resp.statusCode, 200);
	      done(); 
	    });
	});
});
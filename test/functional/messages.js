process.env.NODE_ENV = 'test';

var app = require('../../server'),
	assert = require('assert'),
    request = require('request');

describe('messages REST endpoint', function() {

	it('should create a message', function(done) {
	    request('http://localhost:3050/messages', function(err,resp,body) {
	      assert.equal(resp.statusCode, 200);
	      done(); 
	    });
	});

	it('should return all messages json', function(done) {
		request.post('http://localhost:3050/messages', 
			{ json: { timestamp: new Date(2012,1,31) } }, function(err,resp,body) {
	      assert.equal(resp.statusCode, 200);

	      done(); 
	    }); 
    }); 
});
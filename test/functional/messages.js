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

	it('should create and fetch a message', function(done) {
		request.post(config.base_url + '/messages', 
			{ json: { body: { reading: 5.1 } } }, function(post_err, post_resp, post_body) {
			  assert.equal(post_err, null);
		      assert.equal(post_resp.statusCode, 200);

		      assert.equal(post_body.message.body.reading, 5.1);

		      request({ url: config.base_url + '/messages/' + post_body.message._id, json: true}, function(get_err, get_resp, get_body) {
		      	assert.equal(get_err, null);
	      	  	assert.equal(get_resp.statusCode, 200);

	      		assert.equal(get_body.message.body.reading, 5.1);

	      		done(); 
	    	  });
	    });
    }); 

});
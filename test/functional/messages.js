process.env.NODE_ENV = 'test';

var app = require('../../server'),
	assert = require('assert'),
	config = require('../../config'),
	faye = require('faye'),
    request = require('request');

describe('messages endpoint', function() {
	it('should return all messages json', function(done) {
	    request(config.base_url + '/messages', function(err,resp,body) {
	      assert.equal(resp.statusCode, 200);
	      done(); 
	    });
	});

	it('should create and fetch a message', function(done) {
		var notification_passed = false,
			get_passed = false,
			started_post = false;

		var client = new faye.Client(config.realtime_url);

		client.subscribe('/messages', function(message) {
			assert.equal(message.body.reading, 5.1);
			notification_passed = true;
		    if (notification_passed && get_passed) done(); 
		});

		global.bayeux.bind('subscribe', function(clientId) {
			if (started_post) return;
			started_post = true;

			request.post(config.base_url + '/messages', 
				{ json: { body: { reading: 5.1 } } }, function(post_err, post_resp, post_body) {
				  assert.equal(post_err, null);
			      assert.equal(post_resp.statusCode, 200);

			      assert.equal(post_body.message.body.reading, 5.1);

			      request({ url: config.base_url + '/messages/' + post_body.message.id, json: true}, function(get_err, get_resp, get_body) {
	                assert.equal(get_err, null);
	                assert.equal(get_resp.statusCode, 200);

	                assert.equal(get_body.message.body.reading, 5.1);

	                get_passed = true;
	                if (notification_passed && get_passed) done(); 
	              });
		    });
    	});
	});

});
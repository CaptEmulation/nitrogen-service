process.env.NODE_ENV = 'test';

var app = require('../../server'),
	assert = require('assert'),
	config = require('../../config'),
	faye = require('faye'),
    request = require('request');

describe('device endpoint', function() {

	it('should create and fetch a device', function(done) {
		var notification_passed = false,
			get_passed = false,
			started_post = false;

		var client = new faye.Client(config.realtime_url);

		client.subscribe('/devices', function(device) {
			assert.equal(device.external_id, "opaqueid");
			notification_passed = true;
		    if (notification_passed && get_passed) {
		    	console.log("subscribe calling done.");
		    	done();
		    } 
		});

		global.bayeux.bind('subscribe', function(clientId) {
			if (started_post) return;
			started_post = true;
			
			request.post(config.base_url + '/devices', 
				{ json: { external_id: "opaqueid" } }, function(post_err, post_resp, post_body) {
				  assert.equal(post_err, null);
			      assert.equal(post_resp.statusCode, 200);

			      assert.equal(post_body.device.external_id, "opaqueid");

			      request({ url: config.base_url + '/devices/' + post_body.device.id, json: true}, 
			      	function(get_err, get_resp, get_body) {
		                assert.equal(get_err, null);
		                assert.equal(get_resp.statusCode, 200);

		                assert.equal(get_body.device.external_id, "opaqueid");

		                get_passed = true;

		                if (notification_passed && get_passed) {
		                	console.log('request calling done');
		                	done();
		                } 
	              });
		    });
    	});
	});

	it('should fetch all devices', function(done) {
	    request(config.base_url + '/devices', function(err, resp, body) {
	      assert.equal(resp.statusCode, 200);
	      done(); 
	    });
	});

});
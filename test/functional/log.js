process.env.NODE_ENV = 'test';

var app = require('../../server'),
	assert = require('assert'),
	config = require('../../config'),
	faye = require('faye'),
    request = require('request');

describe('log endpoint', function() {

	it('should be able to accept logs', function(done) {
		request.post(config.base_url + '/logs', 
			{ json: { logs: [ 
						{ device_id: "objectID9234982", text: "Connected." },
						{ device_id: "objectID9234982", text: "Sent message."}
				  ] } 
			}, 
			function(post_err, post_resp, post_body) {
			    assert.equal(post_err, null);
		        assert.equal(post_resp.statusCode, 200);

		        done();
		    }
		);
	});

});
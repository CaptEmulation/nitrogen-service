process.env.NODE_ENV = 'test';

var app = require('../../server'),
	assert = require('assert'),
	config = require('../../config'),
	faye = require('faye'),
    request = require('request');

describe('principal endpoint', function() {

	it('should create and fetch a principal', function(done) {
		var notification_passed = false,
			get_passed = false,
			started_post = false;

		var client = new faye.Client(config.realtime_url);

		client.subscribe('/principals', function(principal_json) {
            var principal = JSON.parse(principal_json);
            if (principal.principal_type != "device") return;

			assert.equal(principal.external_id, "opaqueid");
			notification_passed = true;
		    if (notification_passed && get_passed) {
                console.log("got principal notification");
		    	done();
		    } 
		});

		global.bayeux.bind('subscribe', function(clientId) {
			if (started_post) return;
			started_post = true;
			
			request.post(config.base_url + '/principals', 
				{ json: { principal_type: "device",
                          external_id: "opaqueid" } }, function(post_err, post_resp, post_body) {
				  assert.equal(post_err, null);
			      assert.equal(post_resp.statusCode, 200);

			      assert.equal(post_body.principal.external_id, "opaqueid");

			      request({ url: config.base_url + '/principals/' + post_body.principal.id, json: true}, 
			      	function(get_err, get_resp, get_body) {
		                assert.equal(get_err, null);
		                assert.equal(get_resp.statusCode, 200);

		                assert.equal(get_body.principal.external_id, "opaqueid");

		                get_passed = true;

		                if (notification_passed && get_passed) {
                            console.log("got REST notification");
		                	done();
		                } 
	              });
		    });
    	});
	});

	it('should fetch all principals', function(done) {
	    request(config.base_url + '/principals', function(err, resp, body) {
	      assert.equal(resp.statusCode, 200);
	      done(); 
	    });
	});

    it('should create a user principal', function(done) {
        request.post(config.base_url + '/principals',
            { json: { principal_type: "user",
                      email: "user@gmail.com",
                      password: "sEcReT44" } }, function(err, resp, body) {
                assert.equal(err, null);
                assert.equal(resp.statusCode, 200);
                assert.equal(body.principal.principal_type, "user");
                assert.notEqual(body.principal.id, undefined);
                done();
            });
    });
});
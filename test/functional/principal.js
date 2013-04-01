var app = require('../../server')
  ,	assert = require('assert')
  , config = require('../../config')
  ,	faye = require('faye')
  , fixtures = require('../fixtures')
  , mongoose = require('mongoose')
  , request = require('request');

describe('principal endpoint', function() {

	it('should create and fetch a device principal', function(done) {
		var notification_passed = false,
			get_passed = false,
			started_post = false;

		var client = new faye.Client(config.realtime_url);

		client.subscribe('/principals', function(principal_json) {
            var principal = JSON.parse(principal_json);
            if (principal.principal_type != "device") return;
            if (principal.external_id != "subscription_test") return;

			notification_passed = true;
		    if (notification_passed && get_passed) {
		    	done();
		    } 
		});

		global.bayeux.bind('subscribe', function(clientId) {
			if (started_post) return;
			started_post = true;
			
			request.post(config.base_url + '/principals', 
				{ json: { principal_type: "device",
                          external_id: "subscription_test" } }, function(post_err, post_resp, post_body) {
				  assert.ifError(post_err);
			      assert.equal(post_resp.statusCode, 200);

                  assert.notEqual(post_body.principal.secret, undefined);
                  assert.equal(post_body.principal.secret_hash, undefined);
			      assert.equal(post_body.principal.external_id, "subscription_test");
                  assert.ok(Date.now() < Date.parse(post_body.accessToken.expires_at));

                  assert.equal(post_body.principal.id, post_body.accessToken.principal);

			      request({ url: config.base_url + '/principals/' + post_body.principal.id, json: true},
			      	function(get_err, get_resp, get_body) {
		                assert.equal(get_err, null);
		                assert.equal(get_resp.statusCode, 200);

                        assert.equal(get_body.principal.secret, undefined);
		                assert.equal(get_body.principal.external_id, "subscription_test");

		                get_passed = true;

		                if (notification_passed && get_passed) {
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

    it('should login device principal', function (done) {
        var deviceId = fixtures.models.device.id;
        var externalId = fixtures.models.device.externa_id;
        var secret = fixtures.models.device.secret;

        request.post(config.base_url + '/principals/auth',
            { json: { principal_type: 'device',
                      id: deviceId,
                      secret: secret} }, function(err, resp, body) {
                assert.equal(resp.statusCode, 200);
                done();
            });
    });

    it('should login user principal', function(done) {
        request.post(config.base_url + '/principals/auth',
            { json: { principal_type: 'user',
                      email: 'user@server.org',
                      password: 'sEcReT44'} }, function(err, resp, body) {
                assert.equal(resp.statusCode, 200);
                done();
            });
    });

});
var app = require('../../server')
  ,	assert = require('assert')
  , config = require('../../config')
  ,	faye = require('faye')
  , fixtures = require('../fixtures')
  , mongoose = require('mongoose')
  , request = require('request')
  , services = require('../../services');

describe('principal endpoint', function() {

	it('should create and fetch a device principal', function(done) {
		var notification_passed = false,
			get_passed = false,
			started_post = false;

		var client = new faye.Client(config.realtime_endpoint);
        client.addExtension({
            outgoing: function(message, callback) {
                message.ext = message.ext || {};
                message.ext.access_token = fixtures.models.deviceAccessToken.token;
                callback(message);
            }
        });

		client.subscribe('/principals', function(principal_json) {
            var principal = JSON.parse(principal_json);
            if (principal.principal_type != "device") return;
            if (principal.external_id != "subscription_test") return;

			notification_passed = true;
		    if (notification_passed && get_passed) {
		    	done();
		    } 
		});

		services.realtime.bind('subscribe', function(clientId) {
			if (started_post) return;
			started_post = true;
			
			request.post(config.principals_endpoint,
				{ json: { principal_type: "device",
                          external_id: "subscription_test" } }, function(post_err, post_resp, post_body) {
				  assert.ifError(post_err);
			      assert.equal(post_resp.statusCode, 200);

                  assert.equal(!!post_body.principal.secret, true);
                  assert.equal(post_body.principal.secret_hash, undefined);
			      assert.equal(post_body.principal.external_id, "subscription_test");
                  assert.ok(Date.now() < Date.parse(post_body.accessToken.expires_at));

                  assert.equal(post_body.principal.id, post_body.accessToken.principal);

			      request({ url: config.principals_endpoint + '/' + post_body.principal.id, json: true,
                            headers: { Authorization: "Bearer " + post_body.accessToken.token } }, function(get_err, get_resp, get_body) {
		                assert.equal(get_err, null);
		                assert.equal(get_resp.statusCode, 200);

                        assert.equal(get_body.principal.secret, undefined);
		                assert.equal(get_body.principal.external_id, "subscription_test");
                        assert.notEqual(get_body.principal.last_connection, undefined);
                        assert.notEqual(get_body.principal.last_ip, undefined);

		                get_passed = true;

		                if (notification_passed && get_passed) {
		                	done();
		                }
	              });
		    });
    	});
	});

    it('should reject requests for a principal without access token', function(done) {
        request({ url: config.principals_endpoint + '/' + fixtures.models.device.id, json: true }, function(get_err, get_resp, get_body) {
            assert.equal(get_err, null);
            assert.equal(get_resp.statusCode, 401);
            done();
        });
    })

	it('should fetch all principals', function(done) {
	    request.get({ url: config.principals_endpoint,
                      headers: { Authorization: fixtures.authHeaders.device },
                      json: true }, function(err, resp, body) {

	      assert.equal(resp.statusCode, 200);
          assert.equal(body.principals.length > 0, true);
	      done();
	    });
	});

    it('should fetch only user principals', function(done) {
        request.get({ url: config.principals_endpoint + "?principal_type=user",
                      headers: { Authorization: fixtures.authHeaders.device },
                      json: true }, function(err, resp, body) {
            assert.equal(resp.statusCode, 200);
            assert.equal(body.principals.length > 0, true);

            body.principals.forEach(function(principal) {
                assert.equal(principal.principal_type, 'user');
            });

            done();
        });
    });

    it ('should reject requests for index without access token', function(done) {
        request.get({ url: config.principals_endpoint }, function(err, resp, body) {
            assert.equal(resp.statusCode, 401);
            done();
        });
    });

    it('should login device principal', function (done) {
        var deviceId = fixtures.models.device.id;
        var secret = fixtures.models.device.secret;

        request.post(config.principals_endpoint + '/auth',
            { json: { principal_type: 'device',
                      id: deviceId,
                      secret: secret} }, function(err, resp, body) {
                assert.equal(resp.statusCode, 200);
                assert.notEqual(body.accessToken.token, undefined);

                assert.equal(Date.parse(body.principal.last_connection) > fixtures.models.device.last_connection.getTime(), true);
                assert.notEqual(body.principal.last_ip, undefined);
                done();
            });
    });

    it('should login user principal', function(done) {
        request.post(config.principals_endpoint + '/auth',
            { json: { principal_type: 'user',
                      email: 'user@server.org',
                      password: 'sEcReT44'} }, function(err, resp, body) {
                assert.equal(resp.statusCode, 200);
                assert.notEqual(body.accessToken.token, undefined);

                assert.equal(Date.parse(body.principal.last_connection) > fixtures.models.user.last_connection.getTime(), true);
                assert.notEqual(body.principal.last_ip, undefined);

                done();
            });
    });

});
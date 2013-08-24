var app = require('../../server')
  ,	assert = require('assert')
  , config = require('../../config')
  , fixtures = require('../fixtures')
  , io = require('socket.io-client')
  , mongoose = require('mongoose')
  , request = require('request')
  , services = require('../../services');

describe('principals endpoint', function() {

	it('should create and fetch a device principal', function(done) {
        var subscriptionPassed = false,
            restPassed = false;

        var socket = io.connect(config.subscriptions_endpoint, {
            query: "auth=" + encodeURIComponent(fixtures.models.accessTokens.system.token),
            'force new connection': true
        });

        var subscriptionId = 'sub2';
        socket.emit('start', { id: subscriptionId, type: 'principals' });

        socket.on(subscriptionId, function(principal) {
            if (principal.name !== 'subscription_test') return;

            subscriptionPassed = true;
            console.log('$$$$$$$$$: stopping principal test notification');
            socket.emit('stop', { id: subscriptionId });

            if (subscriptionPassed && restPassed) {
                done();
            }
        });

        setTimeout(function() {
            request.post(config.principals_endpoint,
                { json: { type: 'device',
                          name: "subscription_test" } }, function(post_err, post_resp, post_body) {
                  assert.ifError(post_err);
                  assert.equal(post_resp.statusCode, 200);

                  assert.equal(!!post_body.principal.secret, true);
                  assert.equal(post_body.principal.secret_hash, undefined);
                  assert.equal(post_body.principal.name, "subscription_test");
                  assert.ok(Date.now() < Date.parse(post_body.accessToken.expires_at));

                  assert.equal(post_body.principal.id, post_body.accessToken.principal);

                  principalId = post_body.principal.id;
                  token = post_body.accessToken.token;

                  request({ url: config.principals_endpoint + '/' + post_body.principal.id,
                            json: true,
                            headers: { Authorization: "Bearer " + post_body.accessToken.token } }, function(get_err, get_resp, get_body) {
                        assert.equal(get_err, null);
                        assert.equal(get_resp.statusCode, 200);

                        assert.equal(get_body.principal.secret, undefined);
                        assert.equal(get_body.principal.name, "subscription_test");
                        assert.notEqual(get_body.principal.last_connection, undefined);
                        assert.notEqual(get_body.principal.last_ip, undefined);

                        restPassed = true;
                        if (subscriptionPassed && restPassed) {
                            done();
                        }
                  });
            });
        }, 200);
	});

    it('should be able to remove principal', function(done) {
        request.post(config.principals_endpoint,
                     { json: {
                         type: 'device',
                         name: "subscription_test" }
                     }, function(err, resp, body) {

            assert.ifError(err);
            assert.equal(resp.statusCode, 200);

            request.del({ url: config.principals_endpoint + "/" + body.principal.id,
                headers: { Authorization: "Bearer " + body.accessToken.token } }, function(err, resp, body) {
                assert.ifError(err);
                assert.equal(resp.statusCode, 200);

                done();
            });
        });
    });

    it('should reject requests for a principal without access token', function(done) {
        request({ url: config.principals_endpoint + '/' + fixtures.models.principals.device.id, json: true }, function(get_err, get_resp, get_body) {
            assert.equal(get_err, null);
            assert.equal(get_resp.statusCode, 401);
            done();
        });
    })

	it('should fetch all principals', function(done) {
	    request.get({ url: config.principals_endpoint,
                      headers: { Authorization: fixtures.models.accessTokens.device.toAuthHeader() },
                      json: true }, function(err, resp, body) {

	        assert.equal(resp.statusCode, 200);
            assert.equal(body.principals.length > 0, true);
            body.principals.forEach(function(principal) {
                assert.notEqual(principal.type, 'system');
            });

	        done();
	    });
	});

    it('should fetch only user principals', function(done) {
        request.get({ url: config.principals_endpoint,
                      qs: { q: JSON.stringify({ type: 'user' }) },
                      headers: { Authorization: fixtures.models.accessTokens.device.toAuthHeader() },
                      json: true }, function(err, resp, body) {
            assert.equal(resp.statusCode, 200);
            assert.equal(body.principals.length > 0, true);

            body.principals.forEach(function(principal) {
                assert.equal(principal.type, 'user');
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
        var deviceId = fixtures.models.principals.device.id;
        var secret = fixtures.models.principals.device.secret;

        request.post(config.principals_endpoint + '/auth',
            { json: { type: 'device',
                      id: deviceId,
                      secret: secret} }, function(err, resp, body) {
                assert.equal(resp.statusCode, 200);
                assert.notEqual(body.accessToken.token, undefined);

                assert.equal(Date.parse(body.principal.last_connection) > fixtures.models.principals.device.last_connection.getTime(), true);
                assert.notEqual(body.principal.last_ip, undefined);
                done();
            });
    });

    it('should login user principal', function(done) {
        request.post(config.principals_endpoint + '/auth',
            { json: { type: 'user',
                      email: 'user@server.org',
                      password: 'sEcReT44' } }, function(err, resp, body) {
                assert.equal(resp.statusCode, 200);
                assert.notEqual(body.accessToken.token, undefined);

                assert.equal(Date.parse(body.principal.last_connection) > fixtures.models.principals.user.last_connection.getTime(), true);
                assert.notEqual(body.principal.last_ip, undefined);
                assert.equal(body.principal.password, undefined);

                done();
            });
    });

    it('should return failed authorization for wrong password', function(done) {
        request.post(config.principals_endpoint + '/auth',
            { json: { type: 'user',
                email: 'user@server.org',
                password: 'WRONGPASSWORD'} }, function(err, resp, body) {
                assert.equal(resp.statusCode, 401);
                assert.equal(body.accessToken, undefined);
                assert.notEqual(body.error, undefined);

                var errorJson = JSON.parse(body.error);
                assert.equal(errorJson.statusCode, 401);
                assert.notEqual(errorJson.message, undefined);

                done();
            });
    });

    it('should allow updates to a principals name', function(done) {
        fixtures.models.principals.device.name = "my camera";

        request.put(config.principals_endpoint + "/" + fixtures.models.principals.device.id,
            { headers: { Authorization: fixtures.models.accessTokens.system.toAuthHeader() },
              json: fixtures.models.principals.device }, function(err, resp, body) {
                assert.ifError(err);
                assert.equal(resp.statusCode, 200);

                assert.equal(body.principal.name, "my camera");

                done();
            }
        );
    });

    it('should allow system to impersonate user principal', function(done) {
        request.post(config.principals_endpoint + '/impersonate',
            { headers: { Authorization: fixtures.models.accessTokens.system.toAuthHeader() },
              json: fixtures.models.principals.user }, function(err, resp, body) {
                assert.equal(resp.statusCode, 200);
                assert.notEqual(body.accessToken.token, undefined);

                done();
            });
    });

});
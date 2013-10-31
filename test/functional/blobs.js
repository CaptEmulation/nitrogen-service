var app = require('../../server')
  , assert = require('assert')
  , config = require('../../config')
  , fixtures = require('../fixtures')
  ,	fs = require('fs')
  , request = require('request');

if (config.blob_provider) {

    describe('blobs REST endpoint', function() {
        it('should be able to create and then fetch a blob', function(done) {

            var fixturePath = 'test/fixtures/images/image.jpg';

            fs.stat(fixturePath, function(err, stats) {
                assert.ifError(err);

                fs.createReadStream(fixturePath).
                pipe(
                    request.post({ url: config.blobs_endpoint,
                                   headers: { 'Content-Type': 'image/jpeg', 
                                              'Content-Length': stats.size,
                                              'Authorization': fixtures.models.accessTokens.device.toAuthHeader() } },
                        function (err, resp, body) {
                            assert.ifError(err);

                            var bodyJson = JSON.parse(body);
                            assert.equal(resp.statusCode, 200);
                            assert.equal(bodyJson.blob._id, undefined);
                            assert.notEqual(bodyJson.blob.id, undefined);
                            assert.notEqual(bodyJson.blob.link, undefined);

                            var blobUrl = config.blobs_endpoint + '/' + bodyJson.blob.id;

                            // owner should be able to access blob
                            request.get(blobUrl,
                              { headers: { 'Authorization': fixtures.models.accessTokens.device.toAuthHeader() } }, function(err,resp,body) {
                                assert.ifError(err);
                                assert.equal(resp.statusCode, 200);
                                assert.equal(resp.body.length, 28014);
                                fixtures.models.principals.device.save(function(err) {
                                    assert.ifError(err);

                                    // other users shouldn't be able to access blob
                                    request.get(blobUrl, { headers: { 'Authorization': fixtures.models.accessTokens.anotherUser.toAuthHeader() } }, function(err,resp,body) {
                                        assert.ifError(err);

                                        assert.equal(resp.statusCode, 403);
                                        request.get(blobUrl, { headers: { 'Authorization': fixtures.models.accessTokens.user.toAuthHeader() } }, function(err,resp,body) {
                                            assert.ifError(err);

                                            assert.equal(resp.statusCode, 200);

                                            fixtures.models.principals.device.save(function(err) {
                                                assert.ifError(err);

                                                // need to drop last_ip for anotherUser otherwise matching tests won't work b/c there are two users at ip address.
                                                fixtures.models.principals.anotherUser.last_ip = null;
                                                fixtures.models.principals.anotherUser.save(function(err) {
                                                    done();
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        }
                    )
                );
            });
        });

        it('should return 404 for unknown blobs', function(done) {
            request(config.blobs_endpoint + '/51195d5f11600000deadbeef',
                    { headers: { 'Authorization': fixtures.models.accessTokens.device.toAuthHeader() } }, function(err,resp,body) {
                  assert.equal(resp.statusCode, 404);

                  done();
              });
        });

        it('should not allow unauthenticated access to blobs', function(done) {
            request(config.blobs_endpoint + '/51195d5f11600000deadbeef', function(err,resp,body) {
                assert.equal(resp.statusCode, 401);

                done();
            });
        });

        it('should not allow unauthorized access to blobs', function(done) {
            request(config.blobs_endpoint + '/51195d5f11600000deadbeef', function(err,resp,body) {
                assert.equal(resp.statusCode, 401);

                done();
            });
        });

    });
}
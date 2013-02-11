process.env.NODE_ENV = 'test';

var app = require('../../server'),
	assert = require('assert'),
	Config = require('../../config'),
	fs = require('fs'),
    request = require('request');

var config = new Config();

describe('blobs REST endpoint', function() {
	it('should be able to create a blob', function(done) {

		var fixture_path = 'test/fixtures/images/image.jpg';

		fs.stat(fixture_path, function(err, stats) {
				fs.createReadStream(fixture_path).
				pipe(
					request.post(config.base_url + '/blobs', { headers: { 'Content-Type': 'image/jpeg', 'Content-Length': stats.size } },
						function (err, resp, body) {
						  assert.ifError(err);

						  var body_json = JSON.parse(body);
					      assert.equal(resp.statusCode, 200);
					      assert.notEqual(body_json._id, undefined);

					      done();
						}
					)
				);
		});

    });

	it('should be able to fetch a blob', function(done) {
	    request(config.base_url + '/blobs/511479530acf3d0026000001', function(err,resp,body) {
	    	assert.equal(resp.statusCode, 200);
	    	assert.equal(resp.body.length, 28014);

	    	done();
	    });
	});    
});
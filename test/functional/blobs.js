process.env.NODE_ENV = 'test';

var app = require('../../server'),
	assert = require('assert'),
	Config = require('../../config'),
	fs = require('fs'),
    request = require('request');

var config = new Config();

describe('blobs REST endpoint', function() {
	it('should create a blob', function(done) {
		fs.createReadStream('test/fixtures/images/image.jpg').
			pipe(
				request.post(config.base_url + '/blobs', { headers: { 'Content-Type': 'image/jpeg', 'Content-Length': 29118} },
					function (err, resp, body) {
					  assert.ifError(err);

					  console.log(body);
					  
					  var body_json = JSON.parse(body);
				      assert.equal(resp.statusCode, 200);
				      assert.notEqual(body_json._id, undefined);

				      done();
					}
				)
			);
    });
});
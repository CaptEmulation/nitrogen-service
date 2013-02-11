process.env.NODE_ENV = 'test';

var app = require('../../server'),
	assert = require('assert'),
	Config = require('../../config'),
	fs = require('fs'),
    request = require('request');

var config = new Config();

describe('blobs REST endpoint', function() {
	it('should be able to create and then fetch a blob', function(done) {

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

  					      request(config.base_url + '/blobs/' + body_json._id, function(err,resp,body) {
					    	  assert.equal(resp.statusCode, 200);
					    	  assert.equal(resp.body.length, 28014);

					    	  done();
					      });
						}
					)
				);
		});

    });

    it('should return 404 for unknown blobs', function(done) {
    	request(config.base_url + '/blobs/51195d5f116000000a000001', function(err,resp,body) {
	    	  assert.equal(resp.statusCode, 404);

	    	  done();
	      });
    });

});
var assert = require('assert')
  ,	config = require('../../config')
  , fixtures = require('../fixtures')
  , request = require('request');

describe('agents endpoint', function() {

    it('index should be not be accessible anonymously', function(done) {
        request(config.agents_endpoint, function(err, resp, body) {
            assert.equal(resp.statusCode, 401);
            done();
        });
    });

    it('index should return all agents', function(done) {
        request({ url: config.agents_endpoint,
                  headers: { Authorization: fixtures.models.accessTokens.device.toAuthHeader() },
                             json: true }, function(err,resp,body) {
            assert.ifError(err);
            assert.equal(resp.statusCode, 200);

            assert.notEqual(body.agents, undefined);
            assert.equal(body.agents.length > 0, true);
            assert.notEqual(body.agents[0].execute_as, undefined);
            done();
        });
    });

});

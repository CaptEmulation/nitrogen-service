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

    it('should allow updates to a agent by execute_as user', function(done) {
        fixtures.models.agents.nop.enabled = false;

        request.put(config.agents_endpoint + "/" + fixtures.models.agents.nop.id,
            { headers: { Authorization: fixtures.models.accessTokens.user.toAuthHeader() },
                json: fixtures.models.agents.nop }, function(err, resp, body) {
                assert.ifError(err);
                assert.equal(resp.statusCode, 200);

                assert.equal(body.agent.enabled, false);

                done();
            }
        );
    });

    it('should not allow updates to an agent by a non system principals that isnt execute_as', function(done) {
        request.put(config.agents_endpoint + "/" + fixtures.models.agents.nop.id,
            { headers: { Authorization: fixtures.models.accessTokens.device.toAuthHeader() },
                json: fixtures.models.agents.nop }, function(err, resp, body) {
                assert.ifError(err);
                assert.equal(resp.statusCode, 403);

                done();
            }
        );
    });
});

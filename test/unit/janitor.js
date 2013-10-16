var assert = require('assert')
  , config = require('../../config')
  , fixtures = require('../fixtures')
  , services = require('../../services');

describe('janitor service', function() {
    it('can run iteration', function(done) {
        services.janitor(function(err) {
            assert.ifError(err);
            done();
        });
    });
});
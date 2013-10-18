var assert = require('assert')
  , services = require('../../services');

describe('global service', function() {
    it('can run migrations', function(done) {
        services.global.migrate(function(err) {
            assert.ifError(err);
            done();
        });
    });

    it('can run janitor iteration', function(done) {
        services.global.janitor(function(err) {
            assert.ifError(err);
            done();
        });
    });
});
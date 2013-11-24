var config = require('../config')
  , fixtures = require('./fixtures')
  , log = require('../log')
  , services = require('../services');

before(function(done) {
    config.pubsub_provider.resetForTest(function(err) {
        if (err) return callback(err);

        fixtures.reset(function(err) {
            if (err) throw err;

            log.debug("FIXTURES: creation finished...");
            done();
        });
    });
});

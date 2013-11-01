var fixtures = require('./fixtures')
  , log = require('../log')
  , services = require('../services');

before(function(done) {
    fixtures.reset(function(err) {
        if (err) throw err;

        log.debug("FIXTURES: creation finished...");
        done();
    });
});

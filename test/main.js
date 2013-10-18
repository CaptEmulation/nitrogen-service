var fixtures = require('./fixtures')
  , services = require('../services');

before(function(done) {
    fixtures.reset(function(err) {
        if (err) throw err;

        console.log("FIXTURES: creation finished...");
        done();
    });
});

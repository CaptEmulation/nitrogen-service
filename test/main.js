var fixtures = require('./fixtures');

before(function(done) {
    fixtures.reset(function() {
        console.log("FIXTURES: creation finished...");
        done();
    });
});

var fixtures = require('./fixtures');

process.env.NODE_ENV = 'test';

before(function(done) {
    fixtures.reset(function() {
        console.log("FIXTURES: creation finished...");
        done();
    });
});

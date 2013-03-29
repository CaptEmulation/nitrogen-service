var fixtures = require('./fixtures');

before(function(done) {
    fixtures.reset();

    // TODO: YUCK!  Need to do accounting for all create callbacks in reset and callback done there.
    setTimeout(function() {
        done();
    }, 500);
});
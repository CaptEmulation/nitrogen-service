var fixtures = require('./fixtures');

before(function(done) {
    fixtures.reset();

    // TODO: YUCK!  Need to do accounting for all create callbacks in reset and callback done there.
    setTimeout(function() {
        console.log("signaling fixtures loaded.");
        done();
    }, 500);
});

process.on('uncaughtException',function(error){
    console.log("uncaught exception: " + error);
});
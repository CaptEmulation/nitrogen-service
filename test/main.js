var fixtures = require('./fixtures');

before(function(done) {
    fixtures.reset(done);
});

process.on('uncaughtException',function(error){
    console.log("uncaught exception: " + error);
});
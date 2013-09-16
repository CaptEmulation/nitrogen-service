var assert = require('assert')
  , config = require('../../config')
  , fixtures = require('../fixtures')
  , services = require('../../services');

if (config.blob_provider) {

    describe('blob service', function() {
        it('can remove a blob', function(done) {
            services.blobs.remove(services.principals.servicePrincipal, { _id: fixtures.models.blobs.removableBlob.id }, function(err, removed) {
                assert.ifError(err);
                assert.equal(removed, 1);
                done();
            })
        });
    });
    
}
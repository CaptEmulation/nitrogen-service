var app = require('../../server')
  , assert = require('assert')
  , config = require('../../config')
  , fixtures = require('../fixtures')
  , models = require('../../models')
  , mongoose = require('mongoose')
  , services = require('../../services');

describe('messages service', function() {

    it('can create and delete a message', function(done) {

        var message = new models.Message({ from: fixtures.models.principals.device.id,
                                           message_type: "_test" });

        services.messages.create(message, function(err, savedMessages) {
          assert.ifError(err);
          assert.notEqual(savedMessages[0].id, null);

          services.messages.remove(services.principals.systemPrincipal, savedMessages[0], function(err) {
            assert.equal(err, null);
            done();
          });
        });
    });

    it ('rejects message with invalid principal in from', function(done) {
        var message = new models.Message({ from: new mongoose.Types.ObjectId(),
                                           message_type: "_test" });

        services.messages.create(message, function(err, savedMessages) {
            assert.notEqual(err, null);
            done();
        });
    });

    it ('rejects message without message_type', function(done) {
        var message = new models.Message({ from: fixtures.models.principals.device.id });

        services.messages.create(message, function(err, savedMessages) {
            assert.notEqual(err, null);
            done();
        });
    });

    it ('rejects message without from', function(done) {
        var message = new models.Message({ message_type: "_test" });

        services.messages.create(message, function(err, savedMessages) {
            assert.notEqual(err, null);
            done();
        });
    });

});

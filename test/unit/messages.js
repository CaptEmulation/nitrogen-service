var app = require('../../server')
  , assert = require('assert')
  , config = require('../../config')
  , fixtures = require('../fixtures')
  , models = require('../../models')
  , mongoose = require('mongoose')
  , services = require('../../services');

describe('messages service', function() {

    it('can create and delete a message', function(done) {

        var message = new models.Message({ from: fixtures.models.device.id,
                                           message_type: "image",
                                           body: { url: "http://127.0.0.1/photo.jpg" } });

        services.messages.create(message, function(err, saved_messages) {
          assert.ifError(err);
          assert.notEqual(saved_messages[0].id, null);

          services.messages.remove(saved_messages[0], function(err) {
            assert.equal(err, null);
            done();
          });
        });
    });

    it ('rejects message with invalid principal in from', function(done) {
        var message = new models.Message({ from: new mongoose.Types.ObjectId(),
                                           message_type: "image",
                                           body: { url: "http://127.0.0.1/photo.jpg" } });

        services.messages.create(message, function(err, saved_messages) {
            assert.notEqual(err, null);
            assert.equal(saved_messages.length, 0);
            done();
        });
    });

    it ('rejects message without message_type', function(done) {
        var message = new models.Message({ from: fixtures.models.device.id,
                                           body: { url: "http://127.0.0.1/photo.jpg" } });

        services.messages.create(message, function(err, saved_messages) {
            assert.notEqual(err, null);
            assert.equal(saved_messages.length, 0);
            done();
        });
    });

    it ('rejects message without from', function(done) {
        var message = new models.Message({ message_type: "image",
                                           body: { url: "http://127.0.0.1/photo.jpg" } });

        services.messages.create(message, function(err, saved_messages) {
            assert.notEqual(err, null);
            assert.equal(saved_messages.length, 0);
            done();
        });
    });

});
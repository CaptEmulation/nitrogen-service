var app = require('../../server')
  , assert = require('assert')
  , config = require('../../config')
  , fixtures = require('../fixtures')
  , models = require('../../models')
  , mongoose = require('mongoose')
  , services = require('../../services');

describe('messages service', function() {

    it('can create and removeOne a message', function(done) {

        var message = new models.Message({
            from: fixtures.models.principals.device.id,
            type: "_test",
            body: { reading: 5.1 }
        });

        services.messages.create(message, function(err, savedMessages) {
          assert.ifError(err);
          assert.notEqual(savedMessages[0].id, null);
          assert.equal(savedMessages[0].body_length > 0, true);

          services.messages.removeOne(services.principals.systemPrincipal, savedMessages[0], function(err) {
            assert.equal(err, null);
            done();
          });
        });
    });

    it('can remove messages with a query', function(done) {
        var message = new models.Message({ from: fixtures.models.principals.device.id,
            type: "_test" });

        services.messages.create(message, function(err, savedMessages) {
            assert.ifError(err);
            assert.notEqual(savedMessages[0].id, null);

            services.messages.remove(services.principals.systemPrincipal, { type: "_test" }, function(err) {
                assert.equal(err, null);

                services.messages.find(services.principals.systemPrincipal, { type: "_test" }, function(err, messages) {
                    assert.equal(err, null);
                    assert.equal(messages.length, 0);
                    done();
                });
            });
        });
    });

    it ('rejects message with invalid principal in from', function(done) {
        var message = new models.Message({ from: new mongoose.Types.ObjectId(),
                                           type: "_test" });

        services.messages.create(message, function(err, savedMessages) {
            assert.notEqual(err, null);
            done();
        });
    });

    it ('rejects message without type', function(done) {
        var message = new models.Message({ from: fixtures.models.principals.device.id });

        services.messages.create(message, function(err, savedMessages) {
            assert.notEqual(err, null);
            done();
        });
    });

    it ('rejects message without from', function(done) {
        var message = new models.Message({ type: "_test" });

        services.messages.create(message, function(err, savedMessages) {
            assert.notEqual(err, null);
            done();
        });
    });

    it ('handles log message by creating log entry', function(done) {
        var message = new models.Message({
            from: fixtures.models.principals.device.id,
            type: "log",
            body: {
                severity: "error",
                message: "something terrible happened"
            }
        });

        services.messages.create(message, function(err, savedMessages) {
            assert.equal(err, null);
            done();
        });
    });

    it ('flunks incorrect schema for log message', function(done) {
        var message = new models.Message({
            from: fixtures.models.principals.device.id,
            type: "log",
            body: {
                notright: "error",
                message: "something terrible happened"
            }
        });

        services.messages.create(message, function(err, savedMessages) {
            assert.notEqual(err, null);
            done();
        });
    });

    it ('flunks unknown well known schema', function(done) {
        var message = new models.Message({
            type: "unknownCommand"
        });

        services.messages.create(message, function(err, savedMessages) {
            assert.notEqual(err, null);
            done();
        });
    });

    it('does queries with string object ids correctly', function(done) {
        var deviceIdString = fixtures.models.principals.device.id.toString();
        services.messages.find(fixtures.models.principals.device, { $or: [ { to: deviceIdString }, { from: deviceIdString } ] }, {}, function(err, messages) {
            assert.ifError(err);
            messages.forEach(function(message) {
               console.log("from: " + message.from + " to: " + message.to + " device: " + fixtures.models.principals.device.id);
               assert.equal(message.to && message.to.toString() === fixtures.models.principals.device.id ||
                            message.from && message.from.toString() === fixtures.models.principals.device.id, true);
            });
            done();
        });
    });

});

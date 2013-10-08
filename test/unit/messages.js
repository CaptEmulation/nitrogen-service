var app = require('../../server')
  , assert = require('assert')
  , config = require('../../config')
  , fixtures = require('../fixtures')
  , fs = require('fs')
  , models = require('../../models')
  , mongoose = require('mongoose')
  , services = require('../../services')
  , utils = require('../../utils');

describe('messages service', function() {

    it('can create and removeOne a message', function(done) {

        var message = new models.Message({
            from: fixtures.models.principals.device.id,
            type: "_test",
            body: { reading: 5.1 }
        });

        services.messages.create(fixtures.models.principals.user, message, function(err, savedMessages) {
          assert.ifError(err);
          assert.notEqual(savedMessages[0].id, null);
          assert.equal(savedMessages[0].body_length > 0, true);

          assert(savedMessages[0].expires > utils.dateDaysFromNow(config.default_message_lifetime-1) && 
                 savedMessages[0].expires < utils.dateDaysFromNow(config.default_message_lifetime));

          services.messages.removeOne(services.principals.servicePrincipal, savedMessages[0], function(err) {
            assert.equal(err, null);
            done();
          });
        });
    });

    it('can remove messages with a query', function(done) {
        var message = new models.Message({ from: fixtures.models.principals.device.id,
            type: "_test" });

        services.messages.create(fixtures.models.principals.user, message, function(err, savedMessages) {
            assert.ifError(err);
            assert.notEqual(savedMessages[0].id, null);

            services.messages.remove(services.principals.servicePrincipal, { type: "_test" }, function(err) {
                assert.equal(err, null);

                services.messages.find(services.principals.servicePrincipal, { type: "_test" }, function(err, messages) {
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

        services.messages.create(fixtures.models.principals.user, message, function(err, savedMessages) {
            assert.notEqual(err, null);
            done();
        });
    });

    it ('rejects message without type', function(done) {
        var message = new models.Message({ from: fixtures.models.principals.device.id });

        services.messages.create(fixtures.models.principals.user, message, function(err, savedMessages) {
            assert.notEqual(err, null);
            done();
        });
    });

    it ('rejects message without from', function(done) {
        var message = new models.Message({ type: "_test" });

        services.messages.create(fixtures.models.principals.user, message, function(err, savedMessages) {
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

        services.messages.create(fixtures.models.principals.user, message, function(err, savedMessages) {
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

        services.messages.create(fixtures.models.principals.user, message, function(err, savedMessages) {
            assert.notEqual(err, null);
            done();
        });
    });

    it ('flunks unknown well known schema', function(done) {
        var message = new models.Message({
            type: "unknownCommand"
        });

        services.messages.create(fixtures.models.principals.user, message, function(err, savedMessages) {
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

    it('removes both expired message and blob', function(done) {
        if (!config.blob_provider) return done();

        var fixturePath = 'test/fixtures/images/image.jpg';

        fs.stat(fixturePath, function(err, stats) {
            assert.ifError(err);

            var stream = fs.createReadStream(fixturePath);

            var blob = new models.Blob({
                content_type: 'image/jpg',
                content_length: stats.size
            });

            services.blobs.create(fixtures.models.principals.device, blob, stream, function(err, blob) {
                assert.ifError(err);

                var message = new models.Message({
                    from: fixtures.models.principals.device.id,
                    expires: new Date(2013,1,1),
                    type: 'image',
                    link: blob.link,
                    body: {
                        url: blob.url
                    }
                });

                services.messages.create(fixtures.models.principals.device, message, function(err, messages) {
                    assert.ifError(err);
                    assert.equal(messages.length, 1);

                    // We now have a message with a linked blob.  Running remove with the current time should remove them both.
                    services.messages.remove(services.principals.servicePrincipal, { expires: { $lt: new Date() } }, function(err, removed) {
                        assert.ifError(err);
                        assert.notEqual(removed, 0);

                        services.messages.findById(fixtures.models.principals.device, messages[0].id, function(err, message) {
                            assert.ifError(err);
                            assert.equal(!message, true);

                            services.blobs.findById(blob.id, function(err, blob) {
                                assert.ifError(err);
                                assert.equal(!blob, true);

                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    it('never removes a message nor blob with a never expire', function(done) {
        if (!config.blob_provider) return done();

        var fixturePath = 'test/fixtures/images/image.jpg';

        fs.stat(fixturePath, function(err, stats) {
            assert.ifError(err);

            var stream = fs.createReadStream(fixturePath);

            var blob = new models.Blob({
                content_type: 'image/jpg',
                content_length: stats.size
            });

            services.blobs.create(fixtures.models.principals.device, blob, stream, function(err, blob) {
                assert.ifError(err);

                var message = new models.Message({
                    from: fixtures.models.principals.device.id,
                    expires: models.Message.NEVER_EXPIRE,
                    type: 'image',
                    link: blob.link,
                    body: {
                        url: blob.url
                    }
                });

                services.messages.create(fixtures.models.principals.device, message, function(err, messages) {
                    assert.ifError(err);
                    assert.equal(messages.length, 1);

                    // We now have a message with a linked blob.  Running remove with the current time should remove them both.
                    services.messages.remove(services.principals.servicePrincipal, { expires: { $lt: new Date() } }, function(err, removed) {
                        assert.ifError(err);
                        assert.equal(removed, 0);

                        services.messages.findById(services.principals.servicePrincipal, messages[0]._id, function(err, message) {
                            assert.ifError(err);
                            assert.equal(!message, false);

                            services.blobs.findById(blob.id, function(err, blob) {
                                assert.ifError(err);
                                assert.equal(!blob, false);

                                done();
                            });
                        });
                    });
                });
            });
        });
    });
});
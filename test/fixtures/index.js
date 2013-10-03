var async = require('async')
  , config = require('../../config')
  , fs = require('fs')
  , models = require('../../models')
  , services = require('../../services');

var fixtures = {};

var removeAll = function (modelType, callback) {
    modelType.remove({}, callback);
};

var createDeviceFixtures = function(callback) {
    console.log("FIXTURES: creating device fixtures");

    var device = new models.Principal({ type: 'device',
                                        name: 'existing_device',
                                        public: true });

    services.principals.create(device, function(err, device) {
        if (err) throw err;

        services.principals.updateLastConnection(device, '127.0.0.1');
        fixtures.principals.device = device;

        services.accessTokens.create(device, function(err, accessToken) {
            if (err) throw err;

            // make access token expire in 15 minutes to force an accessToken refresh
            var updates = { expires_at: new Date(new Date().getTime() + (15 * 60000))};
            models.AccessToken.update({ _id: accessToken.id }, { $set: updates }, function (err, updateCount) {
                fixtures.accessTokens.device = accessToken;
                console.log("FIXTURES: creating device fixtures: FINISHED: " + updates.expires_at);
                callback();
            });
        });
    });

};

var createServiceUserFixtures = function(callback) {
    console.log("FIXTURES: creating service user fixtures");
    services.accessTokens.findOrCreateToken(services.principals.servicePrincipal, function(err, accessToken) {
        if (err) throw err;

        fixtures.accessTokens.service = accessToken;
        console.log("FIXTURES: creating service user fixtures: FINISHED");
        callback();
    });
};

var createAgentFixtures = function(callback) {
    console.log("FIXTURES: creating agent fixtures");

    var agent = new models.Agent({
        action: ";",
        execute_as: fixtures.principals.user.id,
        name: "nop"
    });

    services.agents.create(services.principals.servicePrincipal, agent, function(err, agent) {
        if (err) throw err;

        fixtures.agents.nop = agent;
        console.log("FIXTURES: creating agent fixtures finished");

        callback();
    });
};

var createUserFixtures = function(callback) {
    console.log("FIXTURES: creating user fixtures");

    var user = new models.Principal({ type: 'user',
                                      email: 'user@server.org',
                                      public: true,
                                      password: 'sEcReT44' });

    services.principals.create(user, function(err, user) {
        if (err) throw err;

        fixtures.principals.user = user;

        services.accessTokens.create(user, function(err, accessToken) {
            if (err) throw err;

            fixtures.accessTokens.user = accessToken;

            var anotherUser = new models.Principal({
                type: 'user',
                email: 'anotheruser@server.org',
                public: false,
                password: 'sEcReTO66'
            });

            services.principals.create(anotherUser, function(err, user) {
                if (err) throw err;

                fixtures.principals.anotherUser = anotherUser;
                services.accessTokens.create(anotherUser, function(err, accessToken) {
                    if (err) throw err;

                    fixtures.accessTokens.anotherUser = accessToken;

                    console.log("FIXTURES: creating user fixtures: FINISHED");
                    callback();
                });
            });
        });
    });
};

var createBlobFixture = function(callback) {
    console.log("FIXTURES: creating blob fixtures");

    var fixture_path = 'test/fixtures/images/image.jpg';

    fs.stat(fixture_path, function(err, stats) {
        if (err) throw err;

        var blob = new models.Blob({
            content_type: "image/jpeg",
            content_length: stats.size
        });

        var stream = fs.createReadStream(fixture_path);
        services.blobs.create(fixtures.principals.user, blob, stream, function(err, blob) {
            if (err) throw err;

            fixtures.blobs.removableBlob = blob;

            console.log("FIXTURES: creating blob fixtures: FINISHED");

            callback();
        });
    });
};

var createDeviceIpMessageFixture = function(callback) {
    console.log("FIXTURES: creating device ip fixtures");

    var message = new models.Message({ from: fixtures.principals.device.id,
                                       type: "ip",
                                       public: true,
                                       body: { ip_address: "127.0.0.1" } });

    services.messages.create(message, function (err, messages) {
        if (err) throw err;

        fixtures.messages.deviceIp = messages[0];
        console.log("FIXTURES: creating device ip fixtures: FINISHED");
        callback();
    });
};

exports.reset = function(callback) {

    var modelTypes = Object.keys(models).map(function(key) { return models[key]; });

    async.each(modelTypes, removeAll, function(err) {
        if (err) throw err;

        var fixtureFactories = [
            createUserFixtures,
            createDeviceFixtures,
            createAgentFixtures,
            createDeviceIpMessageFixture,
            createServiceUserFixtures
        ];

        if (config.blob_provider) {
            fixtureFactories.push(createBlobFixture);
        }

        async.series(fixtureFactories, callback);
    });

};

var fixtures = {
    accessTokens: {},
    agents: {},
    blobs: {},
    messages: {},
    principals: {}
};

exports.models = fixtures;
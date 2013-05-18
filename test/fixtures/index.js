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
    var device = new models.Principal({ principal_type: 'device',
                                        name: 'existing_device',
                                        public: true,
                                        owner: fixtures.principals.user });

    services.principals.create(device, function(err, device) {
        if (err) throw err;
        fixtures.principals.device = device;

        services.accessTokens.create(device, function(err, accessToken) {
            if (err) throw err;

            fixtures.accessTokens.device = accessToken;
            callback();

        });
    });

};

var createSystemUserFixtures = function(callback) {
    services.accessTokens.findOrCreateToken(services.principals.systemPrincipal, function(err, accessToken) {
        if (err) throw err;

        fixtures.accessTokens.system = accessToken;
        callback();
    });

};

var createAgentFixtures = function(callback) {
    var agent = new models.Agent({
        action: ";",
        execute_as: fixtures.principals.user.id,
        name: "nop"
    });

    services.agents.create(services.principals.systemPrincipal, agent, function(err, agent) {
        if (err) throw err;

        fixtures.agents.nop = agent;
        callback();
    });
};

var createUserFixtures = function(callback) {
    var user = new models.Principal({ principal_type: 'user',
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
                principal_type: 'user',
                email: 'anotheruser@server.org',
                public: false,
                password: 'sEcReTO66'
            });

            services.principals.create(anotherUser, function(err, user) {
                if (err) throw err;

                fixtures.principals.anotherUser = user;

                callback();
            });
        });
    });
};

var createBlobFixture = function(callback) {
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
            callback();
        });
    });
};

var createDeviceIpMessageFixture = function(callback) {
    var message = new models.Message({ from: fixtures.principals.device.id,
                                       type: "ip",
                                       public: true,
                                       body: { ip_address: "127.0.0.1" } });

    services.messages.create(message, function (err, messages) {
        if (err) throw err;

        fixtures.messages.deviceIp = messages[0];
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
            createSystemUserFixtures
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

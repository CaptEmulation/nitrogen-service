var async = require('async')
  , models = require('../../models')
  , services = require('../../services');

var fixtures = {};

var removeAll = function (modelType, callback) {
    modelType.remove({}, callback);
};

var createDeviceFixtures = function(callback) {
    var device = new models.Principal({ principal_type: 'device',
                                        name: 'existing_device',
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

var createDeviceIpMessageFixture = function(callback) {
    var message = new models.Message({ from: fixtures.principals.device.id,
                                       message_type: "ip",
                                       body: { ip_address: "127.0.0.1" } });

    services.messages.create(message, function (err, message) {
        if (err) throw err;

        fixtures.messages.deviceIp = message;
        callback();
    });
};

var createAgentFixtures = function(callback) {
    var agent = new models.Agent({
        action: "",
        execute_as: fixtures.principals.user.id,
        name: "nop"
    });

    services.agents.create(agent, function(err, agent) {
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

        var anotherUser = new models.Principal({ principal_type: 'user',
                                                 email: 'anotheruser@server.org',
                                                 public: false,
                                                 password: 'sEcReTO66' });

        services.principals.create(anotherUser, function(err, user) {
            if (err) throw err;

            fixtures.principals.anotherUser = user;

            callback();
        });
    });
};

var createDeviceIpMessageFixture = function(callback) {
    var message = new models.Message({ from: fixtures.principals.device.id,
                                       message_type: "ip",
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

        async.series([
            createUserFixtures,
            createDeviceFixtures,
            createAgentFixtures,
            createDeviceIpMessageFixture,
            createSystemUserFixtures
        ], callback);

    });

};

var fixtures = {
    accessTokens: {},
    agents: {},
    messages: {},
    principals: {}
};

exports.models = fixtures;

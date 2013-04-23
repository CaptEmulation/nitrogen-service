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

    services.principals.find({ principal_type: "system" }, {}, function(err, principals) {
        if (err) throw err;
        if (principals.length != 1) throw err;

        fixtures.principals.system = principals[0];

        services.accessTokens.findOrCreateToken(fixtures.principals.system, function(err, accessToken) {
            if (err) throw err;

            fixtures.accessTokens.system = accessToken;
            callback();
        });
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

var createUserIpMessageFixture = function(callback) {
    var message = new models.Message({ from: fixtures.principals.user.id,
                                       message_type: "ip",
                                       body: { ip_address: "127.0.0.1" } });

    services.messages.create(message, function (err, messages) {
        if (err) throw err;

        fixtures.messages.userIp = messages[0];
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

var createUserFixture = function(callback) {
    var user = new models.Principal({ principal_type: 'user',
                                      email: 'user@server.org',
                                      public: true,
                                      password: 'sEcReT44' });

    services.principals.create(user, function(err, user) {
        if (err) throw err;

        fixtures.principals.user = user;
        callback();
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
            createUserFixture,
            createDeviceFixtures,
            createAgentFixtures,
            createDeviceIpMessageFixture,
            createUserIpMessageFixture,
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

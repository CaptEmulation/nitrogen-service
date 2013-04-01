var async = require('async')
  , models = require('../../models')
  , services = require('../../services');

var fixtures = {};

var removeAll = function (modelType, callback) {
    modelType.remove({}, callback);
};

var addToFixture = function(fixtureId) {
    return function(err, model) {
        if (err) throw err;
//        console.log("adding model with fixtureId: " + fixtureId + " and mongo id: " + model.id + " to fixtures.  external_id: " + model.external_id + " email: " + model.email);
        fixtures[fixtureId] = model;
    };
};

function authHeaderFromToken(accessToken) {
    return "Bearer " + accessToken.token;
};

exports.reset = function(callback) {
    var modelTypes = Object.keys(models).map(function(key) { return models[key]; });

    async.each(modelTypes, removeAll, function(err) {
        if (err) throw err;

        services.principals.create(
            new models.Principal({principal_type: 'device', external_id: 'existing_device'}),
            function(err, device) {
                if (err) throw err;
                fixtures['device'] = device;

                services.accessTokens.create(device, function(err, accessToken) {
                    fixtures['deviceAccessToken'] = accessToken;
                    exports.authHeaders.device = authHeaderFromToken(accessToken);
                });

                var message = new models.Message({ from: device.id,
                    message_type: "image",
                    body: { url: "http://127.0.0.1/photo.jpg" } });

                services.messages.create(message, addToFixture('deviceMessage'));
            }
        );

        services.principals.create(
            new models.Principal({principal_type: 'user', email: 'user@server.org', password: 'sEcReT44'}),
            addToFixture('user')
        );
    });

};

exports.models = fixtures;
exports.authHeaders = {};


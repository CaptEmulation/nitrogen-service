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

exports.reset = function(callback) {
    var modelTypes = Object.keys(models).map(function(key) { return models[key]; });

    async.each(modelTypes, removeAll, function(err) {
        if (err) throw err;

        services.principals.create(
            new models.Principal({principal_type: 'device', external_id: 'existing_device'}),
            addToFixture('device')
        );

        services.principals.create(
            new models.Principal({principal_type: 'user', email: 'user@server.org', password: 'sEcReT44'}),
            addToFixture('user')
        );
    });

};

exports.models = fixtures;
var async = require("async"),
    models = require("../models");

var create = function(principal, callback) {
    principal.save(function(err, principal) {
        if (err) {
            console.log('principal create error: ' + err);
            return callback(err, null);
        }

        var principal_json = JSON.stringify(principal.toClientView());

        console.log("created principal: " + principal_json);
        global.bayeux.getClient().publish('/principals', principal_json);

        callback(null, principal);
    });
};

var getServicePrincipal = function(callback) {
    models.Principal.where('principal_type').equals('service')
      .exec(function(err, principals) {
        if (err) callback(err, null);

        if (principals.length == 0) {
            var principal = new models.Principal({principal_type: 'service'});
            create(principal, function(err, principal) {
                callback(err, principal);
            });
        } else {
            callback(err, principals[0]);
        }
      });
};

module.exports = {
    create: create,
    getServicePrincipal: getServicePrincipal
};

var async = require('async')
  , config = require('../config')
  , fs = require('fs')
  , log = require('../log')
  , models = require('../models')
  , services = require('../services')

// TODO: when scaled out do we just let all the nodes do this and use the 
// entropy in the offset timing of that automatically scale these deletes?
var janitor = function(callback) {
    services.accessTokens.remove({ expires_at: { $lt: new Date() } }, function(err, removed) {
        if (err) callback("janitor message removal failed: " + err);
        log.info("janitor removed " + removed + " expired access tokens.");

        services.messages.remove(services.principals.servicePrincipal, { expires: { $lt: new Date() } }, function(err, removed) {
            if (err) callback("janitor message removal failed: " + err);
            log.info("janitor removed " + removed + " expired messages.");

            return callback();
        });
    });
};

var migrate = function(callback) {
    models.Metadata.findOne({ key: 'schemaVersion' }, function(err, schemaVersion) {
        if (err) throw err;

        if (!schemaVersion) {
            schemaVersion = new models.Metadata({ key: 'schemaVersion', value: '0' });
            schemaVersion.save();
        }

        log.info('current schema version: ' + schemaVersion.value);

        fs.readdir('./migrations', function(err, files) {
            async.eachSeries(files, function(file, cb) {
                var fileMigrationPosition = parseInt(file);

                if (parseInt(file) > schemaVersion.value) {
                    log.info('starting migration: ' + file);
                    require('../migrations/' + file).up(function(err) {
                        if (err) return cb(err);

                        log.info('migration successful, updating current schema version to ' + fileMigrationPosition);
                        models.Metadata.update({ _id: schemaVersion.id }, { value: fileMigrationPosition }, cb);
                    });
                } else {
                    return cb();
                }
            }, callback);
        });            
    });    
};

var startJanitor = function(callback) {
    setInterval(function() {
        janitor(function(err) {
            if (err) log.error(err);
        });
    }, config.janitor_interval);

    return callback();
};

module.exports = {
    janitor: janitor,
    migrate: migrate,
    startJanitor: startJanitor
};
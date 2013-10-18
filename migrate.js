var async = require('async') 
  , config = require('./config')
  , fs = require('fs')
  , log = require('./log')
  , models = require('./models')
  , mongoose = require('mongoose')
  , services = require('./services');

log.info('connecting to mongodb instance:' + config.mongodb_connection_string);
mongoose.connect(config.mongodb_connection_string);

mongoose.connection.once('open', function () {
    log.info('migration connected to mongodb.');

    services.initialize(function(err) {
        if (err) return log.error("service failed to initialize: " + err);
        if (!services.principals.servicePrincipal) return log.error("Service principal not available after initialize.");

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
                        require('./migrations/' + file).up(function(err) {
                            if (err) return cb(err);

                            log.info('migration successful, updating current schema version to ' + fileMigrationPosition);
                            models.Metadata.update({ _id: schemaVersion.id }, { value: fileMigrationPosition }, cb);
                        });
                    } else {
                        return cb();
                    }
                }, function(err) {
                    if (err) throw err;

		            process.exit();
                });
            });            
        });    
    });

    mongoose.connection.on('error', function(err) {
        log.error('mongodb error: ' + err);
    });
});

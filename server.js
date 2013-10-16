var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , BearerStrategy = require('passport-http-bearer').Strategy
  , config = require('./config')
  , controllers = require('./controllers')
  , log = require('./log')
  , middleware = require('./middleware')
  , models = require('./models')
  , mongoose = require('mongoose')
  , passport = require('passport')
  , path = require('path')
  , services = require('./services')
  , utils = require('./utils');

log.info("connecting to mongodb instance: " + config.mongodb_connection_string);
mongoose.connect(config.mongodb_connection_string);

app.use(middleware.domainErrorHandler);
app.use(express.logger(config.request_log_format));
app.use(express.bodyParser());

app.use(passport.initialize());
passport.use(new BearerStrategy({}, services.accessTokens.verify));

app.use(middleware.crossOrigin);

app.enable('trust proxy');
app.disable('x-powered-by');

// only open endpoints when we have a connection to MongoDB.
mongoose.connection.once('open', function () {
    log.info("service connected to mongodb.");

    services.initialize(function(err) {
        if (err) return log.error("service failed to initialize: " + err);
        if (!services.principals.servicePrincipal) return log.error("Service principal not available after initialize.");

        server.listen(config.internal_port);
        services.subscriptions.attach(server);

        log.info("service has initialized itself, exposing api at: " + config.api_endpoint);

        // REST endpoints

        app.get(config.headwaiter_path,                                            controllers.headwaiter.index);

        app.get(config.agents_path,                middleware.authenticateRequest, controllers.agents.index);
        app.post(config.agents_path,               middleware.authenticateRequest, controllers.agents.create);
        app.put(config.agents_path + '/:id',       middleware.authenticateRequest, controllers.agents.update);

        if (config.blob_provider) {
            app.get(config.blobs_path + '/:id',    middleware.authenticateRequest, controllers.blobs.show);
            app.post(config.blobs_path,            middleware.authenticateRequest, controllers.blobs.create);
        } else {
            log.warn("not exposing blob endpoints because no blob provider configured (see config.js).");
        }

        app.get(config.ops_path + '/health',                                       controllers.ops.health);

        app.get(config.permissions_path,           middleware.authenticateRequest, controllers.permissions.index);

        app.get(config.principals_path + '/:id',   middleware.authenticateRequest, controllers.principals.show);
        app.get(config.principals_path,            middleware.authenticateRequest, controllers.principals.index);
        app.post(config.principals_path,                                           controllers.principals.create);
        app.post(config.principals_path + '/auth',                                 controllers.principals.authenticate);
        app.post(config.principals_path + '/impersonate', middleware.authenticateRequest, controllers.principals.impersonate);
        app.put(config.principals_path + '/:id',   middleware.authenticateRequest, controllers.principals.update);
        app.delete(config.principals_path + '/:id', middleware.authenticateRequest, controllers.principals.remove);

        app.get(config.messages_path + '/:id',     middleware.authenticateRequest, controllers.messages.show);
        app.get(config.messages_path,              middleware.authenticateRequest, controllers.messages.index);
        app.post(config.messages_path,             middleware.authenticateRequest, controllers.messages.create);
        app.delete(config.messages_path,           middleware.authenticateRequest, controllers.messages.remove);

        app.use('/docs', express.static(path.join(__dirname, 'node_modules/nitrogen/docs')));

        app.get('/client/nitrogen.js', function(req, res) { res.send(services.messages.clients['nitrogen.js']) });
        app.get('/client/nitrogen-min.js', function(req, res) { res.send(services.messages.clients['nitrogen-min.js']) });

        app.use(express.static(path.join(__dirname, '/static')));

        log.info("service has initialized endpoints");

        // TODO: make starting this and API endpoint configurable to enable single vs. horizontally scaled deployments
        services.agents.start(config, function(err) {
            if (err) log.error("agent service failed to start: " + err);
        });

        mongoose.connection.on('error', function(err) {
            log.error('mongodb error: ' + err);
        });
    });

});

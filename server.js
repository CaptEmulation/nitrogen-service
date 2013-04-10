var express = require('express')
  , app = express()
  , BearerStrategy = require('passport-http-bearer').Strategy
  , config = require('./config')
  , controllers = require('./controllers')
  , faye = require('faye')
  , middleware = require('./middleware')
  , models = require('./models')
  , mongoose = require('mongoose')
  , passport = require('passport')
  , services = require('./services');

console.log("connecting to mongodb instance: " + config.mongodb_connection_string);
mongoose.connect(config.mongodb_connection_string);

var server = app.listen(process.env.PORT || config.http_port || 3030);
console.log('listening for http connections on ' + config.base_url);

app.use(express.logger());
app.use(express.bodyParser());

app.use(passport.initialize());
passport.use(new BearerStrategy({}, services.accessTokens.verify));

app.use(middleware.crossOrigin);
app.use(middleware.remoteIp);

app.disable('x-powered-by');

// only establish routing to endpoints
mongoose.connection.once('open', function () {
    app.use(express.static(__dirname + '/static'));

    // REST endpoints

    app.get(config.api_prefix + 'v1/headwaiter',                                     controllers.headwaiter.index);

    app.get(config.api_prefix + 'v1/blobs/:id',      middleware.authenticateRequest, controllers.blobs.show);
    app.post(config.api_prefix + 'v1/blobs',         /*middleware.authenticateRequest,*/ controllers.blobs.create);

    app.get(config.api_prefix + 'v1/ops/health',                                     controllers.ops.health);

    app.get(config.api_prefix + 'v1/principals/:id', middleware.authenticateRequest, controllers.principals.show);
    app.get(config.api_prefix + 'v1/principals',     middleware.authenticateRequest, controllers.principals.index);
    app.post(config.api_prefix + 'v1/principals',                                    controllers.principals.create);
    app.post(config.api_prefix + 'v1/principals/auth',                               controllers.principals.authenticate);

    //app.put(config.api_prefix + 'v1/principals/:id',   /* authenticateRequest, */ controllers.principals.update);
    //app.delete(config.api_prefix + 'v1/principals/:id',   /* authenticateRequest, */ controllers.principals.update);

    app.get(config.api_prefix + 'v1/messages/:id',   middleware.authenticateRequest, controllers.messages.show);
    app.get(config.api_prefix + 'v1/messages',       middleware.authenticateRequest, controllers.messages.index);
    app.post(config.api_prefix + 'v1/messages',      middleware.authenticateRequest, controllers.messages.create);

    services.realtime.attach(server, config);
});

// TODO: log errors once we have real logging solution in place.
//mongoose.connection.on('error', function(err) {
//    console.error('MongoDB error: %s', err);
//});

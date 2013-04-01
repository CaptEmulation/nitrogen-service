var   express = require('express'),
      app = express(),
      BearerStrategy = require('passport-http-bearer').Strategy,
      config = require('./config'),
      controllers = require('./controllers'),
      faye = require('faye'),
      http = require('http'),
      models = require('./models'),
      mongoose = require('mongoose'),
      passport = require('passport')
      port = process.env.PORT || config.http_port || 3030,
      services = require('./services');

var server = app.listen(port);
console.log('listening for http connections on ' + config.base_url);

app.use(express.bodyParser());

app.use(passport.initialize());
passport.use(new BearerStrategy({}, services.accessTokens.verify));

// Allow cross domain access
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    // Everything out of magenta is JSON
    res.setHeader('Content-Type', 'application/json');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        res.send(200);
    } else {
        next();
    }
});

var authenticateRequest = function(req, res, next) {
    console.log("AUTH headers: " + JSON.stringify(req.headers));
    if (req.user) { return next() } // already authenticated via session cookie
    passport.authenticate(['bearer'], { session: false })(req, res, next);
};

// REST endpoints

app.get(config.api_prefix + 'v1/headwaiter',                            controllers.headwaiter.index);

app.get(config.api_prefix + 'v1/blobs/:id',        /* authenticateRequest, */ controllers.blobs.show);
app.post(config.api_prefix + 'v1/blobs',           /* authenticateRequest, */ controllers.blobs.create);

app.get(config.api_prefix + 'v1/ops/health',                            controllers.ops.health);

app.get(config.api_prefix + 'v1/principals/:id',   /* authenticateRequest, */ controllers.principals.show);
app.get(config.api_prefix + 'v1/principals',       /* authenticateRequest, */ controllers.principals.index);
app.post(config.api_prefix + 'v1/principals',                           controllers.principals.create);
app.post(config.api_prefix + 'v1/principals/auth',                      controllers.principals.authenticate);
//app.put(config.api_prefix + 'v1/principals/:id',   /* authenticateRequest, */ controllers.principals.update);
//app.delete(config.api_prefix + 'v1/principals/:id',   /* authenticateRequest, */ controllers.principals.update);

app.get(config.api_prefix + 'v1/messages/:id',     /* authenticateRequest, */ controllers.messages.show);
app.get(config.api_prefix + 'v1/messages',         authenticateRequest,  controllers.messages.index);
app.post(config.api_prefix + 'v1/messages',        /* authenticateRequest, */ controllers.messages.create);

// static serving endpoint

app.use(express.static(__dirname + '/static'));

console.log("connecting to mongodb instance: " + config.mongodb_connection_string);
mongoose.connect(config.mongodb_connection_string);

// Realtime endpoint setup

global.bayeux = new faye.NodeAdapter({
  mount: config.path_prefix + config.realtime_path,
  timeout: 90
});

/*
global.bayeux.bind('handshake', function(clientId) {
  console.log('handshake received: ' + clientId);
});

global.bayeux.bind('subscribe', function(clientId, channel) {
  console.log('subscribe received: ' + clientId + ":" + channel);
});

global.bayeux.bind('publish', function(clientId, channel, data) {
  console.log('publish received: ' + clientId + ":" + channel + " :" + data);
});
*/

global.bayeux.attach(server);
console.log('listening for realtime connections on ' + config.path_prefix + config.realtime_path);

if (process.env.NODE_ENV != "production") {
    mongoose.connection.on('error', function(err) {
        console.error('MongoDB error: %s', err);
    });
}

//services.principals.getServicePrincipal(function(err, callback) {

//  use magenta sdk with system principal to execute agents.
//  var service = new Service(config);

//  service.connect(service.principal, function(err, session) {
//     session.attachAgent(agents.devicePairings);
//  });

//});

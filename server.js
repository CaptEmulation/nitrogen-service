//var agents = require('./agents'),
var    config = require('./config'),
    controllers = require('./controllers'),
    models = require('./models'),
    mongoose = require('mongoose'),
    express = require('express'),
    app = express(),

    http = require('http'),
    port = process.env.PORT || config.http_port || 3030,
    faye = require('faye');

var server = app.listen(port);
console.log('listening for http connections on ' + config.base_url);

var allowCrossDomain = function(req, res, next) {
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
};

app.use(allowCrossDomain);
app.use(express.bodyParser());

// REST endpoint routing

app.get('/api/v1/blobs/:id', controllers.blobs.show);
app.post('/api/v1/blobs', controllers.blobs.create);

app.get('/api/v1/ops/health', controllers.ops.health);

app.get('/api/v1/principals/:id', controllers.principals.show);
app.get('/api/v1/principals', controllers.principals.index);
app.post('/api/v1/principals', controllers.principals.create);

app.get('/api/v1/messages/:id', controllers.messages.show);
app.get('/api/v1/messages', controllers.messages.index);
app.post('/api/v1/messages', controllers.messages.create);

// client serving endpoint

// app.use(express.static(__dirname + '/client'));
// TODO: use symlink to grunted version of latest client that works with this service.

mongoose.connect(config.mongodb_connection_string);

// Realtime endpoint setup

global.bayeux = new faye.NodeAdapter({
  mount: config.path_prefix + config.realtime_path,
  timeout: 90
});

global.bayeux.bind('handshake', function(clientId) {
  console.log('handshake received: ' + clientId);
});

global.bayeux.bind('subscribe', function(clientId, channel) {
  console.log('subscribe received: ' + clientId + ":" + channel);
});

global.bayeux.bind('publish', function(clientId, channel, data) {
  console.log('publish received: ' + clientId + ":" + channel + " :" + data);
});

global.bayeux.attach(server);
console.log('listening for realtime connections on ' + config.path_prefix + config.realtime_path);

if (process.env.NODE_ENV != "production") {
    mongoose.connection.on('error', function(err) {
        console.error('MongoDB error: %s', err);
    });
}

//services.principals.getServicePrincipal(function(err, callback) {

  // use magenta sdk with system principal to execute agents.
//  magenta.Service.initialize(config, function(err, service) {
//      if (err) return console.log(err);

//      service.connect(service.principal, function(err, session) {
//          session.attachAgent(agents.autopairing);
//      });
//  });

//});

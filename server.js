var config = require('./config'),
    controllers = require('./controllers'),
    mongoose = require('mongoose');
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

app.get('/blobs/:id', controllers.blobs.show);
app.post('/blobs', controllers.blobs.create);

app.get('/ops/health', controllers.ops.health);

app.get('/principals/:id', controllers.principals.show);
app.get('/principals', controllers.principals.index);
app.post('/principals', controllers.principals.create);

app.get('/messages/:id', controllers.messages.show);
app.get('/messages', controllers.messages.index);
app.post('/messages', controllers.messages.create);

mongoose.connect(config.mongodb_connection_string);

// Realtime endpoint setup

global.bayeux = new faye.NodeAdapter({
  mount: config.realtime_path,
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
console.log('listening for realtime connections on ' + config.realtime_url);

if (process.env.NODE_ENV != "production") {
    mongoose.connection.on('error', function(err) {
        console.error('MongoDB error: %s', err);
    });    

    mongoose.set('debug', true);
}
var Config = require('./config'),
    config = new Config(),
    controllers = require('./controllers'),
    express = require('express'),
    app = express(),

    http = require('http'),
    port = process.env.PORT || config.http_port || 3030,
    server = app.listen(port),
    io = require('socket.io').listen(server),

    mongoose = require('mongoose'),
    redis = require('redis');

console.log('listening for http connections on port ' + port + '...');

var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  // everything is JSON out of magenta

  res.setHeader('Content-Type', 'application/json');

  // intercept OPTIONS method
  if ('OPTIONS' == req.method) {
    res.send(200);
  } else {
    next();
  }
}

app.use(allowCrossDomain);
app.use(express.bodyParser());

app.get('/blobs/:id', controllers.blobs.show);
app.post('/blobs', controllers.blobs.create);
 
app.get('/messages/:id', controllers.messages.show);
app.get('/messages', controllers.messages.index);
app.post('/messages', controllers.messages.create);

console.log("mongodb: " + config.mongodb_connection_string);
mongoose.connect(config.mongodb_connection_string);
var db = mongoose.connection;
db.once('open', function callback() {
	console.log("mongodb connection established");
});

var pubsubClient = redis.createClient(config.redis_port, config.redis_host);
pubsubClient.subscribe("messages");

io.sockets.on('connection', function (socket) {
  pubsubClient.on('message', function(channel, message) {
    socket.emit('message', message);
  });

//  socket.on('subscribe', function (list) {
//    console.log("subscription: " + list);
//  });
});
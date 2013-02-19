var Config = require('./config'),
    config = new Config(),
    controllers = require('./controllers'),
    express = require('express'),
    app = express(),

    http = require('http'),
    port = process.env.PORT || config.http_port || 3030,
    server = app.listen(port),
    io = require('socket.io').listen(server),

    mongoose = require('mongoose');

console.log('listening for http connections on port ' + port + '...');

var allowCrossOrigin = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  // everything is JSON out of magenta

  res.setHeader('Content-Type', 'application/json');

  // intercept OPTIONS method
  if ('OPTIONS' == req.method) {
    res.send(200);
  } else {
    next();
  }
};

app.use(allowCrossOrigin);
app.use(express.bodyParser());

app.get('/blobs/:id', controllers.blobs.findById);
app.post('/blobs', controllers.blobs.create);
 
app.get('/messages/:id', controllers.messages.findById);
app.get('/messages', controllers.messages.findAll);
app.post('/messages', controllers.messages.create);

console.log("mongodb: " + config.mongodb_connection_string);
mongoose.connect(config.mongodb_connection_string);
var db = mongoose.connection;
db.once('open', function callback() {
	console.log("mongodb connection established");
});

io.sockets.on('connection', function (socket) {
    socket.emit('deviceid', { hello: "world"});

//  socket.on('subscribe', function (list) {
//    console.log("subscription: " + list);
//  });

//  socket.on('online', function() {
//    console.log("got online message");
//  });

});
var Config = require('./config'),
	controllers = require('./controllers'),
	express = require('express'),
    mongoose = require('mongoose');

var app = express();
var config = new Config();

var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Credentials', true);
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
}

app.use(allowCrossDomain);
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

port = process.env.PORT || config.http_port || 3030;

app.listen(port);
console.log('listening for http connections on port ' + port + '...');
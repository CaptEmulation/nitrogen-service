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

//app.get('/js/ember.js', function(req, res) { res.sendfile('vendor/javascript/ember-1.0.0-pre.4.js'); });
//app.get('/js/ember-data.js', function(req, res) { res.sendfile('vendor/javascript/ember-data-latest.js'); });
//app.get('/js/handlebars.js', function(req, res) { res.sendfile('vendor/javascript/handlebars.js'); });
//app.get('/js/jquery.js', function(req, res) { res.sendfile('vendor/javascript/jquery-1.9.1.min.js'); });

//app.get('/js/app.js', function(req, res){ res.sendfile('assets/javascript/app.js'); });
//app.get('/', function(req, res){ res.sendfile('assets/app.html'); });

console.log("pointing at mongodb: " + config.mongodb_url);
mongoose.connect(config.mongodb_url);
var db = mongoose.connection;
db.once('open', function callback() {
	console.log("mongodb connection established");
});

port = process.env.PORT || config.http_port || 3030;

app.listen(port);
console.log('listening for http connections on port ' + port + '...');
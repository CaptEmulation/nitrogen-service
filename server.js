var Config = require('./config'),
	controllers = require('./controllers'),
	express = require('express'),
    mongoose = require('mongoose');

var app = express();
var config = new Config();

app.use(express.bodyParser());

app.post('/blobs', controllers.blobs.create);
 
app.get('/messages', controllers.messages.findAll);
//app.get('/messages/:id', msg_controller.findById);
app.post('/messages', controllers.messages.create);

console.log("pointing at mongodb: " + config.mongodb_url);
mongoose.connect(config.mongodb_url);
var db = mongoose.connection;
db.once('open', function callback() {
	console.log("mongodb connection established");
});

app.listen(config.http_port);
console.log('listening for http connections on port ' + config.http_port + '...');
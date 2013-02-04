var express = require('express'),
    messages = require('./controllers/messages');
 
var app = express();
 
app.get('/messages', messages.findAll);
app.get('/messages/:id', messages.findById);
 
app.listen(3000);
console.log('Listening on port 3000...');
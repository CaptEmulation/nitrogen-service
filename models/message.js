var mongoose = require('mongoose');

var messageSchema = mongoose.Schema({
	timestamp: { type: Date, default: Date.now }
});

var Message = mongoose.model('Message', messageSchema);

module.exports = {
  Message: Message
}
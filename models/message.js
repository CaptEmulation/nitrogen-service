var mongoose = require('mongoose');

var messageSchema = mongoose.Schema({
	timestamp: { type: Date, default: Date.now },
//	principal_id: { type: String },
//	schema: { type: String },
//	schema_version: { type: Number }
});

var Message = mongoose.model('Message', messageSchema);

module.exports = {
  Message: Message
}
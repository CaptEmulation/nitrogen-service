var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
    Mixed = Schema.Types.Mixed;

var messageSchema = mongoose.Schema({
	timestamp: { type: Date, default: Date.now },
//	principal_id: { type: String },
	schema_type: { type: String },
	schema_version: { type: Number },
	attributes: { type: Mixed }
});

var Message = mongoose.model('Message', messageSchema);

module.exports = {
  Message: Message
}
var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
    Mixed = Schema.Types.Mixed;

var messageSchema = mongoose.Schema({
	timestamp: { type: Date, default: Date.now },
//	from: { type: String },  		// who emitted this message
//	to: { type: String },  			// who should respond message is targeted to (if any)
//  response_to: { type: ObjectId } // message this message is in response to
	body_schema: { type: String },
	schema_version: { type: Number },
	body: { type: Mixed }
});

var Message = mongoose.model('Message', messageSchema);

module.exports = {
  Message: Message
}
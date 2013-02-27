var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
    Mixed = Schema.Types.Mixed;

var messageSchema = mongoose.Schema({
	created_at: { type: Date, default: Date.now },
	timestamp: { type: Date, default: Date.now },
//	from: { type: ObjectId },  		// principal who emitted this message
//	to: { type: ObjectId },  			// principal message is targeted to (if any)
//  response_to: { type: ObjectId } // message this message is in response to (if any)
	message_type: { type: String },
	schema_version: { type: Number },
	body: { type: Mixed }
});

var Message = mongoose.model('Message', messageSchema);
Message.prototype.transformForClient = function() {
	var obj = this.toObject();

	obj.id = obj._id;
	delete obj._id;
	delete obj.__v;

	return obj;
};

module.exports = Message;
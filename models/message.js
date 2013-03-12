var BaseSchema = require('./base_schema'),
	mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var messageSchema = new BaseSchema();
messageSchema.add({
	timestamp: { type: Date, default: Date.now },
	expires: { type: Date },
	message_type: { type: String },
	schema_version: { type: Number },

	from: { type: Schema.Types.ObjectId, ref: 'Principal' },  	  // principal who sent message
	to: { type: Schema.Types.ObjectId, ref: 'Principal' },  	  // message target (if any)
    response_to: { type: Schema.Types.ObjectId, ref: 'Message' }, // message this is in response to (if any)

	body: { type: Schema.Types.Mixed }
});

messageSchema.index({ timestamp: 1, type: -1 });
messageSchema.index({ from: 1, type: 1 });
messageSchema.index({ to: 1, type: 1 });
messageSchema.index({ message_type: 1, type: 1 });
messageSchema.index({ expires: 1, type: 1 });

var Message = mongoose.model('Message', messageSchema);
Message.prototype.toClientView = BaseSchema.toClientView;

module.exports = Message;
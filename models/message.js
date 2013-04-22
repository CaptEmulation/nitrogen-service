var async = require('async')
  , BaseSchema = require('./baseSchema')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var messageSchema = new BaseSchema();
messageSchema.add({
	timestamp: { type: Date, default: Date.now },
	expires: { type: Date },
	message_type: { type: String },
	schema_version: { type: Number },

    public: { type: Boolean, default: false },
    visible_to: [{ type: Schema.Types.ObjectId, ref: 'Principal' }],

	from: { type: Schema.Types.ObjectId, ref: 'Principal' },  	  // principal who sent message
	to: { type: Schema.Types.ObjectId, ref: 'Principal' },  	  // message target (if any)
    response_to: { type: Schema.Types.ObjectId, ref: 'Message' }, // message this is in response to (if any)

	body: { type: Schema.Types.Mixed, default: {} }
});

messageSchema.index({ expires: 1 });
messageSchema.index({ from: 1 });
messageSchema.index({ message_type: 1 });
messageSchema.index({ public: 1 });
messageSchema.index({ timestamp: 1, type: -1 });
messageSchema.index({ to: 1 });
messageSchema.index({ visible_to: 1 });

messageSchema.set('toObject', { transform: BaseSchema.baseObjectTransform });
messageSchema.set('toJSON', { transform: BaseSchema.baseObjectTransform });

var Message = mongoose.model('Message', messageSchema);

module.exports = Message;
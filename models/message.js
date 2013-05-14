var async = require('async')
  , BaseSchema = require('./baseSchema')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var messageSchema = new BaseSchema();
messageSchema.add({
    message_type: { type: String },                 // s
    schema_version: { type: Number },               // sv

    // a link ties this message to another resource.
    link: { type: Schema.Types.ObjectId },          // link
	timestamp: { type: Date, default: Date.now },   // ts
	expires: { type: Date },                        // expires

    public: { type: Boolean, default: false },
    visible_to: [{ type: Schema.Types.ObjectId, ref: 'Principal' }],

	from: { type: Schema.Types.ObjectId, ref: 'Principal' },  	  // principal who sent message
	to: { type: Schema.Types.ObjectId, ref: 'Principal' },  	  // message target (if any)
    response_to: { type: Schema.Types.ObjectId, ref: 'Message' }, // message this is in response to (if any)

	body: { type: Schema.Types.Mixed, default: {} },
    body_length: { type: Number }                   // len
});

messageSchema.index({ expires: 1 });
messageSchema.index({ from: 1 });
messageSchema.index({ link: 1 });
messageSchema.index({ message_type: 1 });
messageSchema.index({ public: 1 });
messageSchema.index({ timestamp: 1, type: -1 });
messageSchema.index({ to: 1 });
messageSchema.index({ visible_to: 1 });

messageSchema.set('toObject', { transform: BaseSchema.baseObjectTransform });
messageSchema.set('toJSON', { transform: BaseSchema.baseObjectTransform });

var Message = mongoose.model('Message', messageSchema);

Message.prototype.isCustomType = function() {
    return this.message_type[0] == "_";
};

Message.prototype.is = function(type) {
    return this.message_type == type;
};

module.exports = Message;
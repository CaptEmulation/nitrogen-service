var async = require('async')
  , config = require('../config')
  , BaseSchema = require('./baseSchema')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var messageSchema = new BaseSchema();
messageSchema.add({
    type: { type: String },                 // schema type
    ver: { type: Number, default: 0.1 },    // schema version

    // a link ties this message to another resource.
    link: { type: Schema.Types.ObjectId },          // link to other resources (eg. blob)
	  ts: { type: Date, default: Date.now },          // timestamp
	  expires: { type: Date },                        // expires

    public: { type: Boolean, default: true },

	  from: { type: Schema.Types.ObjectId, ref: 'Principal' },  	    // principal who sent message
	  to: { type: Schema.Types.ObjectId, ref: 'Principal' },  	      // message target (if any)
    response_to: [{ type: Schema.Types.ObjectId, ref: 'Message' }], // message(s) this is in response to

	  body: { type: Schema.Types.Mixed, default: {} },

    // internal fields

    visible_to: [{ type: Schema.Types.ObjectId, ref: 'Principal' }],
    body_length: { type: Number }
});

messageSchema.index({ expires: 1 });
messageSchema.index({ from: 1 });
messageSchema.index({ link: 1 });
messageSchema.index({ type: 1 });
messageSchema.index({ public: 1 });
messageSchema.index({ ts: 1, type: -1 });
messageSchema.index({ to: 1 });
messageSchema.index({ visible_to: 1 });

config.message_indexes.forEach(function(index) {
    messageSchema.index(index);
});

messageSchema.set('toObject', { transform: BaseSchema.baseObjectTransform });
messageSchema.set('toJSON', { transform: BaseSchema.baseObjectTransform });

var Message = mongoose.model('Message', messageSchema);

Message.prototype.expired = function() {
    return Date.now() > this.expires.getTime();
};

Message.prototype.isCustomType = function() {
    return this.type[0] === "_";
};

Message.prototype.is = function(type) {
    return this.type === type;
};

module.exports = Message;
var BaseSchema = require('./base_schema'),
	mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var messageSchema = new BaseSchema();
messageSchema.add({
	timestamp: { type: Date, default: Date.now },
	expires: { type: Date },
	message_type: { type: String },
	schema_version: { type: Number },

	from: { type: Schema.Types.ObjectId },  	  // principal who emitted this message
	to: { type: Schema.Types.ObjectId },  		  // principal message is targeted to (if any)
    response_to: { type: Schema.Types.ObjectId }, // message this is in response to (if any)

	body: { type: Schema.Types.Mixed }
});

messageSchema.path('message_type').validate(function (value) {
  return !!value;
}, 'Message must have message type.');

messageSchema.path('schema_version').validate(function (value) {
  return !!value;
}, 'Message must have schema_version.');

messageSchema.path('from').validate(function (value) {
  return !!value;
}, 'Message must have from principal.');

var Message = mongoose.model('Message', messageSchema);
Message.prototype.toClientObject = function() {
	var obj = this.toObject();

	obj.id = obj._id;
	delete obj._id;
	delete obj.__v;

	return obj;
};

module.exports = Message;
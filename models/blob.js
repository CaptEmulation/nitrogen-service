var BaseSchema = require('./baseSchema'),
	mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var blobSchema = new BaseSchema();
blobSchema.add({
	content_length: { type: Number },
	content_type: { type: String },

	owner: { type: Schema.Types.ObjectId, ref: 'Principal' },

    // a link is an unique objectId that ties this blob to a message.
    link: { type: Schema.Types.ObjectId }
});

blobSchema.index({ link: 1 });

blobSchema.set('toObject', { transform: BaseSchema.baseObjectTransform });
blobSchema.set('toJSON', { transform: BaseSchema.baseObjectTransform });

var Blob = mongoose.model('Blob', blobSchema);

module.exports = Blob;
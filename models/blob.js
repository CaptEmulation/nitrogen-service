var BaseSchema = require('./base_schema'),
	mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var blobSchema = new BaseSchema();
blobSchema.add({
	created_at: { type: Date, default: Date.now },
	content_length: { type: Number },
	content_type: { type: String },

	owner: { type: Schema.Types.ObjectId }
});

var Blob = mongoose.model('Blob', blobSchema);

Blob.prototype.toClientView = BaseSchema.toClientView;

module.exports = Blob;
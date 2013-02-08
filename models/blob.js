var mongoose = require('mongoose');

var blobSchema = mongoose.Schema({
	created_at: { type: Date, default: Date.now },
	url: { type: String },
//	principal_id: { type: String },
});

var Blob = mongoose.model('Blob', blobSchema);

module.exports = {
  Blob: Blob
}
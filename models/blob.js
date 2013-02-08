var mongoose = require('mongoose');

var blobSchema = mongoose.Schema({
	created_at: { type: Date, default: Date.now },
//	principal_id: { type: String },
});

var Blob = mongoose.model('Blob', blobSchema);

module.exports = {
  Blob: Blob
}
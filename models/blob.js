var mongoose = require('mongoose');

var blobSchema = mongoose.Schema({
	created_at: { type: Date, default: Date.now },
//	principal_id: { type: String },
});

var Blob = mongoose.model('Blob', blobSchema);
Blob.prototype.transformForClient = function() {
	var obj = this.toObject();

	obj.id = obj._id;
	delete obj._id;
	delete obj.__v;

	return obj;
}

module.exports = {
  Blob: Blob
}
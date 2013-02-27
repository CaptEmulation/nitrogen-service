var mongoose = require('mongoose');

var logSchema = mongoose.Schema({
	// service assigned
	created_at: { type: Date, default: Date.now },

	// device assigned
	timestamp: {type: Date, default: Date.now},

	device_id: { type: String },
	text: { type: String },
});

var Log = mongoose.model('Log', logSchema);
Log.prototype.transformForClient = function() {
	var obj = this.toObject();

	obj.id = obj._id;
	delete obj._id;
	delete obj.__v;

	return obj;
}

module.exports = Log;
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

module.exports = Log;
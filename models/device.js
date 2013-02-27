var BaseModel = require('./base_model'),
	mongoose = require('mongoose');

var deviceSchema = mongoose.Schema({
	created_at: { type: Date, default: Date.now },
	external_id: { type: String },

	last_ip: { type: String },
	last_connection: { type: Date, default: Date.now }
});

var Device = mongoose.model('Device', deviceSchema);
Device.prototype.transformForOutput = function() {
	var obj = this.toObject();

	obj.id = obj._id;
	delete obj._id;
	delete obj.__v;

	return obj;
}

module.exports = Device;
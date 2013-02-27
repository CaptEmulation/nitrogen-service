var BaseSchema = require('./base_schema'),
	mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var principalSchema = new BaseSchema();
principalSchema.add({

	principal_type: {type: String},

	last_ip: { type: String },
	last_connection: { type: Date, default: Date.now },

	external_id: { type: String },

// device (only valid for "device" principal type)

    manufacturer_id: { type: String },

// user (only valid for "user" principal type)

	email: { type: String },
	password_hash: { type: String },
	salt: { type: String },

// group (only valid for "group" principal type)
	
	name: { type: String },
	owner: { type: Schema.Types.ObjectId },
	principals: { type: Array }
});

var Principal = mongoose.model('Principal', principalSchema);
Principal.prototype.toClientObject = function() {
	var obj = this.toObject();

	obj.id = obj._id;
	delete obj._id;
	delete obj.__v;

	return obj;
};

module.exports = Principal;
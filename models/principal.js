var BaseSchema = require('./baseSchema')
  ,	mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var principalSchema = new BaseSchema();
principalSchema.add({

	principal_type: { type: String },        // user, device, service, app

	last_ip: { type: String },
	last_connection: { type: Date, default: Date.now },

    capabilities: { type: Array },
    external_id: { type: String },

// account (billing principal and root owner for all principals)
	// could be 1-1 with user for personal account to 1-many with user for corporate.

// owner of this principal (could be account or user)
// for devices this could be initially null to indicate that pairing needed

	owner: { type: Schema.Types.ObjectId, ref: 'Principal' },			// account that owns this device

// device items

    manufacturer_id: { type: String },

// user items

	email: { type: String },
	password_hash: { type: String },
	salt: { type: String },

// group items (used to organize and permisson principals)

	name: { type: String },
	principals: { type: Array }

});

principalSchema.index({ email: 1, type: 1 });

principalSchema.path('principal_type').validate(function (value) {
  return !!value;
}, 'Principal must have principal_type.');

var Principal = mongoose.model('Principal', principalSchema);
Principal.prototype.toClientView = BaseSchema.toClientView;

module.exports = Principal;
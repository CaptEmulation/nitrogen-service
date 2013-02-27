var mongoose = require('mongoose'),
	util = require('util');

var BaseSchema = function() {

  mongoose.Schema.call(this);

  // base fields used by all models
  this.add({
	created_at: { type: Date, default: Date.now } 
  });
}

util.inherits(BaseSchema, mongoose.Schema);

module.exports = BaseSchema;
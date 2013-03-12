var mongoose = require('mongoose'),
	util = require('util');

var BaseSchema = function() {

  mongoose.Schema.call(this);

  // base fields used by all models
  this.add({
	created_at: { type: Date, default: Date.now } 
  });
};

util.inherits(BaseSchema, mongoose.Schema);

BaseSchema.toClientView = function() {
    var obj = this.toObject();

    obj.id = obj._id;
    delete obj._id;
    delete obj.__v;

    return obj;
};

module.exports = BaseSchema;
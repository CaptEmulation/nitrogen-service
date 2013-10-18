var async = require('async')
  , config = require('../config')
  , BaseSchema = require('./baseSchema')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var metadataSchema = new BaseSchema();
metadataSchema.add({
    key:           { type: String },
    value:         { type: String }
});

metadataSchema.index({ key: 1 });

var Metadata = mongoose.model('Metadata', metadataSchema);

module.exports = Metadata;
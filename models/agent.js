var BaseSchema = require('./baseSchema'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var agentSchema = new BaseSchema();

agentSchema.add({
    name:       { type: String },
    action:     { type: String },
    execute_as: { type: Schema.Types.ObjectId, ref: 'Principal' },
    params:     { type: Schema.Types.Mixed }
});

agentSchema.set('toObject', { transform: BaseSchema.baseObjectTransform });
agentSchema.set('toJSON', { transform: BaseSchema.baseObjectTransform });

agentSchema.index({ execute_as: 1 });

var Agent = mongoose.model('Agent', agentSchema);

module.exports = Agent;

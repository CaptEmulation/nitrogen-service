var BaseSchema = require('./baseSchema'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var subscriptionSchema = new BaseSchema();
subscriptionSchema.add({
    filter: { type: String },
    name: { type: String },
    principal: { type: Schema.Types.ObjectId, ref: 'Principal' },
    permanent: {type: Boolean },
    type: { type: String }
});

subscriptionSchema.index({ principal: 1 });
subscriptionSchema.index({ name: 1 });

subscriptionSchema.set('toObject', { transform: BaseSchema.baseObjectTransform });
subscriptionSchema.set('toJSON', { transform: BaseSchema.baseObjectTransform });

var Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
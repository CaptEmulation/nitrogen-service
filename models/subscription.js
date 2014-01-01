var BaseSchema = require('./baseSchema'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var subscriptionSchema = new BaseSchema();
subscriptionSchema.add({
    filter: { type: Schema.Types.Mixed },
    name: { type: String },
    principal: { type: Schema.Types.ObjectId, ref: 'Principal' },
    permanent: { type: Boolean },
    last_receive: { type: Date, default: Date.now },
    type: { type: String }
});

subscriptionSchema.index({ principal: 1 });
subscriptionSchema.index({ name: 1 });

subscriptionSchema.set('toObject', { transform: BaseSchema.baseObjectTransform });
subscriptionSchema.set('toJSON', { transform: BaseSchema.baseObjectTransform });

subscriptionSchema.virtual('clientId').set(function(value) { this._clientId = value; });
subscriptionSchema.virtual('clientId').get(function() { return this._clientId; });

subscriptionSchema.virtual('socket').set(function(value) { this._socket = value; });
subscriptionSchema.virtual('socket').get(function() { return this._socket; });

var Subscription = mongoose.model('Subscription', subscriptionSchema);

Subscription.prototype.fullyQualifiedName = function() {
   return this.principal + "_" + this.name; 
};

module.exports = Subscription;
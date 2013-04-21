var BaseSchema = require('./baseSchema'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var accessTokenSchema = new BaseSchema();
accessTokenSchema.add({
    principal: { type: Schema.Types.ObjectId, ref: 'Principal' },
    expires_at: { type: Date },
    token: { type: String }
});

accessTokenSchema.index({ expires: 1 });
accessTokenSchema.index({ token: 1 });

accessTokenSchema.set('toObject', { transform: BaseSchema.baseObjectTransform });
accessTokenSchema.set('toJSON', { transform: BaseSchema.baseObjectTransform });

var AccessToken = mongoose.model('AccessToken', accessTokenSchema);

AccessToken.prototype.expired = function() {
    return Date.now() > this.expires_at.getTime();
};

AccessToken.prototype.toAuthHeader = function() {
    return "Bearer " + this.token;
};

module.exports = AccessToken;
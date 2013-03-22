var BaseSchema = require('./baseSchema'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var accessTokenSchema = new BaseSchema();
accessTokenSchema.add({
    principal_id: { type: Schema.Types.ObjectId, ref: 'Principal' },
    expires_at: { type: Date },
    token: { type: String }
});

accessTokenSchema.index({ expires: 1 });
accessTokenSchema.index({ token: 1 });

var AccessToken = mongoose.model('AccessToken', accessTokenSchema);
AccessToken.prototype.toClientView = BaseSchema.toClientView;

AccessToken.prototype.expired = function() {
    return Date.now() > this.expires_at.getTime();
};

module.exports = AccessToken;
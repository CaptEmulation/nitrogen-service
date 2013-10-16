var BaseSchema = require('./baseSchema')
  , log = require('../log')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , sift = require('sift');

var permissionSchema = new BaseSchema();

permissionSchema.add({
    issuedTo:     { type: Schema.Types.ObjectId, ref: 'Principal' },
    principalFor: { type: Schema.Types.ObjectId, ref: 'Principal' },
    expires:      { type: Date },
    action:       { type: String },
    filter:       { type: Schema.Types.Mixed, default: {} },
    priority:     { type: Number },
    authorized:   { type: Boolean }
});

permissionSchema.index({ issuedTo: 1 });
permissionSchema.index({ forPrincipal: 1 });

permissionSchema.set('toObject', { transform: BaseSchema.baseObjectTransform });
permissionSchema.set('toJSON', { transform: BaseSchema.baseObjectTransform });

var Permission = mongoose.model('Permission', permissionSchema);

Permission.priorityComparison = function(a,b) {
    return a.priority - b.priority;
};

Permission.prototype.expired = function() {
    return this.expires && Date.now() > this.expires.getTime();
};

Permission.prototype.match = function(requestingPrincipal, principalFor, action, obj) {
    if (this.expired()) {
        log.debug('permission: ' + JSON.stringify(this) + ': expired: match == false');
        return false;
    }

    if (this.issuedTo && !this.issuedTo.equals(requestingPrincipal.id)) {
        log.debug('permission: ' + JSON.stringify(this) + ': issuedTo mismatch: match == false');
        return false;
    }

    if (this.principalFor && !this.principalFor.equals(principalFor.id)) {
        log.debug('permission: ' + JSON.stringify(this) + ': principalFor mismatch: match == false');
        return false;
    }

    log.debug('checking filter: ' + JSON.stringify(this.filter) + ' against: ' + JSON.stringify([obj]));
    if (this.filter && sift(this.filter, [obj]).length > 0) {
        log.debug('filter matches: match == true');
        return true;
    }

    return false;
};

module.exports = Permission;
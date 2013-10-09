var BaseSchema = require('./baseSchema')
  , log = require('../log')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , sift = require('sift');

var permissionSchema = new BaseSchema();

permissionSchema.add({
    issuedTo:     { type: Schema.Types.ObjectId, ref: 'Principal' },
    forPrincipal: { type: Schema.Types.ObjectId, ref: 'Principal' },
    expires:      { type: Date },
    action:       { type: String },
    filter:       { type: Schema.Types.Mixed, default: {} },
    priority:     { type: Number, default: 1000 },
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

Permission.prototype.match = function(principal, action, obj) {
    if (this.expired()) {
        log.debug('permission: ' + JSON.stringify(this) + ': expired: match == false');
        return false;
    }

    if (this.principal && !this.principal.equals(principal.id)) {
        log.debug('permission: ' + JSON.stringify(this) + ': not equal: match == false');
        return false;
    }

    if (this.filter && sift(this.filter, [obj]).length > 0) {
        log.debug('permission: ' + JSON.stringify(this) + ': matches: match == true');
        return true;
    }

    return false;
};

module.exports = Permission;
var BaseSchema = require('./baseSchema')
  , log = require('../log')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , sift = require('sift');

var permissionSchema = new BaseSchema();

permissionSchema.add({
    issued_to:     { type: Schema.Types.ObjectId, ref: 'Principal' },
    principal_for: { type: Schema.Types.ObjectId, ref: 'Principal' },

    expires:      { type: Date },
    action:       { type: String },
    filter:       { type: String, default: "{}" },
    priority:     { type: Number },
    authorized:   { type: Boolean }
});

permissionSchema.index({ issued_to: 1 });
permissionSchema.index({ principal_for: 1 });

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

    if (this.issued_to && !this.issued_to.equals(requestingPrincipal.id)) {
        log.debug('permission: ' + JSON.stringify(this) + ': issued_to mismatch: match == false');
        return false;
    }

    if (this.principal_for && (!principalFor || !this.principal_for.equals(principalFor.id))) {
        log.debug('permission: ' + JSON.stringify(this) + ': principal_for mismatch: match == false');
        return false;
    }

    log.debug('checking filter: ' + JSON.stringify(this.filter) + ' against: ' + JSON.stringify([obj]));
    if (this.filter) {
        if (!this.filterObject) {
            console.dir(this.filter);
            this.filterObject = JSON.parse(this.filter);
        }

        if (sift(this.filterObject, [obj]).length > 0) {
            log.debug('filter matches: match == true');
            return true;
        }
    }

    return false;
};

Permission.DEFAULT_PRIORITY_BASE = 2000000000;

module.exports = Permission;

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
    action:       { type: String, enum: ['admin', 'send', 'subscribe', 'view'] },
    filter:       { type: String },
    priority:     { type: Number, required: true },
    authorized:   { type: Boolean, required: true }
});

permissionSchema.index({ issued_to: 1 });
permissionSchema.index({ priority: 1 });
permissionSchema.index({ principal_for: 1 });

permissionSchema.path('authorized').validate(function (value) {
    return value === false || value === true;
}, 'Permission must have valid authorized field.');

permissionSchema.set('toObject', { transform: BaseSchema.baseObjectTransform });
permissionSchema.set('toJSON', { transform: BaseSchema.baseObjectTransform });

var Permission = mongoose.model('Permission', permissionSchema);

Permission.priorityComparison = function(a,b) {
    return a.priority - b.priority;
};

Permission.prototype.expired = function() {
    return this.expires && Date.now() > this.expires.getTime();
};

Permission.prototype.match = function(request, obj) {
    if (this.expired()) {
        log.debug('permission: ' + JSON.stringify(this) + ': expired: match == false');
        return false;
    }

    if (this.action && this.action !== request.action) {
        log.debug('permission: ' + JSON.stringify(this) + ': action mismatch: match == false');
        return false;
    }

    if (this.issued_to && !this.issued_to.equals(request.principal)) {
        log.debug('permission: ' + JSON.stringify(this) + ': issued_to mismatch: match == false');
        return false;
    }

    if (this.principal_for && (!request.principal_for || !this.principal_for.equals(request.principal_for))) {
        log.debug('permission: ' + JSON.stringify(this) + ': principal_for mismatch: match == false');
        return false;
    }

    if (!this.filter) {
        return true;
    }

    log.debug('checking filter: ' + JSON.stringify(this.filter) + ' against: ' + JSON.stringify([obj]));

    // filter is stored as a string.  if we haven't previously parsed it into an object, do that now.
    if (!this.filterObject) {
        this.filterObject = JSON.parse(this.filter);
    }

    return sift(this.filterObject, [obj]).length > 0;
};

Permission.DEFAULT_PRIORITY_BASE = 2000000000;

module.exports = Permission;

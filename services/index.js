var async = require('async')
  , config = require('../config')
  , log = require('../log');

exports.accessTokens = require('./accessTokens');
exports.agents = require('./agents');
exports.blobs = require('./blobs');
exports.email = require('./email');
exports.global = require('./global');
exports.messages = require('./messages');
exports.permissions = require('./permissions');
exports.principals = require('./principals');
exports.subscriptions = require('./subscriptions');

exports.initialize = function(callback) {
    async.series([
        exports.principals.initialize,
        exports.global.migrate,
        exports.agents.initialize,
        exports.messages.initialize,
        exports.blobs.initialize,
        exports.permissions.initialize,

        exports.global.startJanitor
    ], callback);
};

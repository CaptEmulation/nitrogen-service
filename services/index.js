var async = require('async');

exports.accessTokens = require('./accessTokens');
exports.agents = require('./agents');
exports.blobs = require('./blobs');
exports.messages = require('./messages');
exports.principals = require('./principals');
exports.subscriptions = require('./subscriptions');

exports.initialize = function(callback) {
    async.series([
        exports.principals.initialize,
        exports.agents.initialize,
        exports.messages.initialize,
        exports.blobs.initialize
    ], callback);
};

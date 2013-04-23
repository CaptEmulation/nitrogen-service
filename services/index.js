exports.accessTokens = require('./accessTokens');
exports.agents = require('./agents');
exports.blobs = require('./blobs');
exports.log = require('./log');
exports.messages = require('./messages');
exports.principals = require('./principals');
exports.realtime = require('./realtime');

exports.initialize = function(callback) {
    exports.principals.initialize(callback);
};

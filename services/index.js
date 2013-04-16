exports.accessTokens = require('./accessTokens');
exports.agents = require('./agents');
exports.blobs = require('./blobs');
exports.messages = require('./messages');
exports.principals = require('./principals');
exports.realtime = require('./realtime');

exports.initialize = function(callback) {
    exports.principals.initialize(function(err, system) {
        if (err) return callback(err);

        exports.agents.initialize(system, callback);
    })
};
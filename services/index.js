var async = require('async')
  , config = require('../config')
  , log = require('../log');

exports.accessTokens = require('./accessTokens');
exports.agents = require('./agents');
exports.blobs = require('./blobs');
exports.messages = require('./messages');
exports.principals = require('./principals');
exports.subscriptions = require('./subscriptions');

exports.janitor = function(callback) {
    exports.accessTokens.remove({ expires_at: { $lt: new Date() } }, function(err, removed) {
        if (err) callback("janitor message removal failed: " + err);
        log.info("janitor removed " + removed + " expired access tokens.");

        exports.messages.remove(exports.principals.servicePrincipal, { expires: { $lt: new Date() } }, function(err, removed) {
            if (err) callback("janitor message removal failed: " + err);
            log.info("janitor removed " + removed + " expired messages.");

            return callback();
        });
    });
};

var start = function(callback) {
    setInterval(function() {
        exports.janitor(function(err) {
            if (err) log.error(err);
        });
    }, 
    config.janitor_interval);

    return callback();
};

exports.initialize = function(callback) {
    async.series([
        exports.principals.initialize,
        exports.agents.initialize,
        exports.messages.initialize,
        exports.blobs.initialize,

        start
    ], callback);
};

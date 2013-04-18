var fs = require('fs')
  , models = require('../models')
  , path = require('path')
  , services = require('../services');

var create = function(agent, callback) {
    agent.save(function(err, agent) {
        if (err) return callback(err);

        callback(null, [agent]);
    });
};

var find = function(filter, options, callback) {
    models.Agent.find(filter, null, options, callback);
};

var load = function(agentPath) {
    return fs.readFileSync(path.join("./agents", agentPath), "utf8");
}

var initialize = function(system, callback) {
    find({ execute_as: system.id, name: "deviceMatching" }, {}, function(err, agents) {
        if (err) return callback(err);

        if (agents.length == 0) {
            // create system device matching agent.

            var deviceMatchingAgent = new models.Agent({ execute_as: system.id,
                                                         name: "deviceMatching",
                                                         action: load("deviceMatching.js") });

            deviceMatchingAgent.save(callback);
        } else {
            callback(null, agents[0]);
        }
    });
};

module.exports = {
    create: create,
    find: find,
    initialize: initialize
};
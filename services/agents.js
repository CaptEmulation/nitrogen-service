var async = require('async')
  , fs = require('fs')
  , models = require('../models')
  , nitrogen = require('nitrogen')
  , path = require('path')
  , services = require('../services')
  , vm = require('vm');

var create = function(agent, callback) {
    agent.save(function(err, agent) {
        if (err) return callback(err);

        callback(null, [agent]);
    });
};

var find = function(filter, options, callback) {
    models.Agent.find(filter, null, options, callback);
};

// TODO: split out everything below into separate service?

var loadAgents = function(system, callback) {
    find({}, {}, function(err, agents) {
        if (err) return callback(err);

        var agentDir = "./agents/";

        fs.readdir(agentDir, function(err, agentFiles) {
            if (err) return callback("failed to enumerate built in agents: " + err);

            async.each(agentFiles, function(file, callback) {
                var agentPath = agentDir + file;

                fs.readFile(agentPath, function (err, action) {
                    if (err) return callback(err);

                    var builtInAgent = new models.Agent({ action: action,
                                                          execute_as: system.id,
                                                          name: file });

                    agents.push(builtInAgent);

                    callback();
                });
            }, function (err) {
                console.log("total agents: " + agents.length);
                return callback(err, agents);
            });

        });
    });
};

var buildSystemClientSession = function(config, callback) {

    services.principals.find({ principal_type: "system" }, {}, function(err, principals) {

        if (err) return callback(err);
        if (principals.length != 1) return callback("Found more than one system principal!");

        var system = principals[0];

        services.accessTokens.findOrCreateToken(system, function(err, accessToken) {
            if (err) return callback(err);

            var service = new nitrogen.Service(config);

            var clientPrincipal = new nitrogen.Principal(system);

            var session = new nitrogen.Session(service, clientPrincipal, accessToken);

            return callback(err, system, session);
        });
    });
};

var prepareAgents = function(session, agents, callback) {
    async.map(agents, function(agent, callback) {
        agent.compiledAction = vm.createScript(agent.action);

        session.impersonate(agent.execute_as, function(err, impersonatedSession) {
            agent.session = impersonatedSession;
            callback(err, agent);
        });
    }, callback);
};

var initialize = function(config, callback) {

    buildSystemClientSession(config, function(err, system, session) {
        if (err) return callback("build system client session failed: " + err);

        loadAgents(system, function (err, agents) {
            if (err) return callback("agent fetch failed: " + err);

            prepareAgents(session, agents, function(err, preparedAgents) {
                if (err) return callback("preparing agents failed: " + err);

                return callback(null, session, preparedAgents);
            });
        });
    });
};

var start = function(system, callback) {
    initialize(system, function(err, session, compiledAgents) {
        if (err) return callback(err);

        // TODO: use queuing and not realtime to ensure that every message is processed?
        // TODO: split agent execution between multiple worker nodes to scale?
        // NOTE: onMessage here should only event messages that are visible for the session the agent is executing under.

        session.onMessage(function(message) {
            console.log("message received for agent processing: " + JSON.stringify(message));
            execute(compiledAgents, message, function(err) {
                console.log("agent execution failed with error: " + err);
            });
        });
    });
};

var execute = function(agents, message, callback) {
    agents.forEach(function(agent) {
        var context = { console: console, message: message, nitrogen: nitrogen, session: agent.session };
        agent.compiledAction.runInNewContext(context);
    });

    callback(null, []);
};

module.exports = {
    create: create,
    execute: execute,
    find: find,
    initialize: initialize,
    start: start
};
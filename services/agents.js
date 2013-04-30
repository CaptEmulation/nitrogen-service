var async = require('async')
  , cron = require('cron')
  , fs = require('fs')
  , log = require('../log')
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
                log.info("total agents: " + agents.length);
                return callback(err, agents);
            });

        });
    });
};

var buildSystemClientSession = function(config, callback) {
    if (!services.principals.systemPrincipal) return callback("System principal not available.");

    services.accessTokens.findOrCreateToken(services.principals.systemPrincipal, function(err, accessToken) {
        if (err) return callback(err);

        var service = new nitrogen.Service(config);
        var clientPrincipal = new nitrogen.Principal(services.principals.systemPrincipal);

        var session = new nitrogen.Session(service, clientPrincipal, accessToken);

        return callback(err, session);
    });
};

var prepareAgents = function(session, agents, callback) {
    async.map(agents, function(agent, callback) {
        agent.compiledAction = vm.createScript(agent.action);

        session.impersonate(agent.execute_as, function(err, impersonatedSession) {
            if (err || !impersonatedSession) {

                log.error("failed to impersonate agent session, skipping agent: " + agent.name + ":" + agent.id);
                return callback(null, null);
            }

            agent.session = impersonatedSession;
            callback(null, agent);
        });
    }, callback);
};

var initialize = function(config, callback) {

    buildSystemClientSession(config, function(err, session) {
        if (err) return callback("build system client session failed: " + err);

        loadAgents(services.principals.systemPrincipal, function (err, agents) {
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

        // TODO: use queuing to split agent execution between nodes to scale?

        execute(compiledAgents, function(err) {
            if (err) log.error("agent execution failed with error: " + err);
        });
    });
};

var execute = function(agents, callback) {

    // TODO: this limits us to 1 machine since each instance will load all agents.
    // Break agents out to their own role type and then enable automatically dividing
    // agents between instances of that role.

    async.each(agents, function(agent, callback) {
        
        var context = { async: async,
                        cron: cron,
                        log: log,
                        nitrogen: nitrogen,
                        session: agent.session,
                        setInterval: setInterval,
                        setTimeout: setTimeout };

        try {
            agent.compiledAction.runInNewContext(context);
            log.info("Agent " + agent.name + " started.");
        } catch (e) {
            log.error("Agent" + agent.name + " quit after throwing exception: " + e.toString());
        }

        callback();
    }, callback);
};

module.exports = {
    create: create,
    execute: execute,
    find: find,
    initialize: initialize,
    start: start
};

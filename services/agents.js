var async = require('async')
  , cron = require('cron')
  , fs = require('fs')
  , log = require('../log')
  , models = require('../models')
  , nitrogen = require('nitrogen')
  , path = require('path')
  , services = require('../services')
  , utils = require('../utils')
  , vm = require('vm');

var AGENT_NOT_FOUND = "Agent not found.";
var PRINCIPAL_REQUIRED = "Principal required to complete operation.";

var buildSystemClientSession = function(config, callback) {
    if (!services.principals.systemPrincipal) return callback("System principal not available.");

    services.accessTokens.findOrCreateToken(services.principals.systemPrincipal, function(err, accessToken) {
        if (err) return callback(err);

        var service = new nitrogen.Service(config);
        var clientPrincipal = new nitrogen.Principal(services.principals.systemPrincipal);
        clientPrincipal.id = accessToken.principal.id;

        var socket = service.connectSocket(clientPrincipal, accessToken);

        var session = new nitrogen.Session(service, clientPrincipal, accessToken, socket);

        return callback(err, session);
    });
};

var create = function(principal, agent, callback) {
    if (!principal) return callback(new utils.ServiceError({
        statusCode: 401,
        message: PRINCIPAL_REQUIRED
    }));

    if (!principal.is('system'))
        agent.execute_as = principal.id;

    agent.save(function(err, agent) {
        if (err) return callback(err);

        callback(null, agent);
    });
};

var execute = function(agents, callback) {

    // TODO: this limits us to 1 machine since each instance will load all agents.
    // Break agents out to their own role type and then enable automatically dividing
    // agents between instances of that role.

    async.each(agents, function(agent, callback) {

        if (agent && agent.enabled && agent.session) {
            var context = {
                async: async,
                cron: cron,
                log: log,
                nitrogen: nitrogen,
                params: agent.params,
                session: agent.session,
                setInterval: setInterval,
                setTimeout: setTimeout
            };

            try {
                agent.compiledAction.runInNewContext(context);
                log.info("Agent " + agent.name + " started.");
            } catch (e) {
                log.error("Agent " + agent.name + " quit after throwing exception: " + e.stack);
            }
        }

        callback();
    }, callback);
};

var filterForPrincipal = function(principal, filter) {
    if (principal && principal.is('system')) return filter;

    if (!principal.isAdmin()) {
        filter["$and"] = [ { execute_as: principal._id } ];
    }

    return filter;
};

var find = function(principal, filter, options, callback) {
    models.Agent.find(filterForPrincipal(principal, filter), null, options, callback);
};

var findById = function(principal, agentId, callback) {
    models.Agent.findOne(filterForPrincipal(principal, { "_id": agentId }), function(err, agent) {
        if (err) return callback(err);
        if (!agent) return callback(404);
        if (!principal.isAdmin() && agent.execute_as != principal.id) return callback(403);

        return callback(null, agent);
    });
};
// TODO: split out everything below into separate service?

var initialize = function(callback) {

    var agentDir = "./agents/";
    fs.readdir(agentDir, function(err, agentFiles) {
        if (err) return callback("failed to enumerate built in agents: " + err);

        log.info('agents initializing: ' + agentFiles.length + ' built-in agents.');

        // TODO: break out per agent setup into another function.
        async.each(agentFiles, function(file, callback) {
            var agentPath = agentDir + file;

            fs.readFile(agentPath, function (err, action) {
                if (err) return callback(err);

                find(services.principals.systemPrincipal, { name: file, execute_as: services.principals.systemPrincipal.id }, function (err, agents) {
                    if (err) return callback(err);

                    if (agents.length > 0) {
                        log.info("found existing agent for built-in agent: " + file + ": updating with latest action.");

                        update(services.principals.systemPrincipal, agents[0].id, { action: action }, callback);
                    } else {
                        log.info("no existing agent for built-in agent: " + file + ": creating.");
                        var agent = new models.Agent({ action: action,
                                                       enabled: true,
                                                       execute_as: services.principals.systemPrincipal.id,
                                                       name: file });
                        create(services.principals.systemPrincipal, agent, callback);
                    }
                });
            });
        }, callback);
    });
};

var prepareAgents = function(session, agents, callback) {
    async.map(agents, function(agent, callback) {
        if (!agent.enabled) return callback(null, agent);

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

var start = function(config, callback) {
    buildSystemClientSession(config, function(err, session) {
        if (err) return callback("build system client session failed: " + err);

        find(services.principals.systemPrincipal, {}, {}, function (err, agents) {
            if (err) return callback("agent fetch failed: " + err);

            prepareAgents(session, agents, function(err, preparedAgents) {
                if (err) return callback(err);

                execute(preparedAgents, function(err) {
                    if (err) log.error("agent execution failed with error: " + err);

                    callback();
                });
            });
        });
    });
};

var update = function(principal, id, updates, callback) {
    findById(principal, id, function(err, agent) {
        if (err) return callback(err);
        if (!agent) return callback(new utils.ServiceError({
            statusCode: 404,
            message: AGENT_NOT_FOUND
        }));

        if (!principal.isAdmin() && principal.id != agent.execute_as) return callback(403);

        models.Agent.update({ _id: id }, { $set: updates }, function(err, updated) {
            if (err) return callback(err);

            findById(principal, id, callback);
        });
    });
};

module.exports = {
    create: create,
    execute: execute,
    find: find,
    findById: findById,
    initialize: initialize,
    start: start,
    update: update
};

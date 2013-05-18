var async = require('async')
  , config = require('../config')
  , faye = require('faye')
  , models = require('../models')
  , services = require('../services')
  , utils = require('../utils');

exports.create = function(req, res) {
    var agent = new models.Agent(req.body);

    services.agents.create(req.user, agent, function(err, agent) {
        if (err) return utils.handleError(res, err);

        res.send({ 'agent': agent });
    });
};

exports.index = function(req, res) {
    var query = utils.parseQuery(req);
    var options = utils.parseOptions(req);

    services.agents.find(req.user, query, options, function(err, agents) {
        if (err) return res.send(400, err);

        res.send({"agents": agents});
    });
};

exports.update = function(req, res) {
    services.agents.update(req.user, req.params.id, req.body, function(err, agent) {
        if (err) return utils.handleError(res, err);

        res.send({ agent: agent });
    });
};
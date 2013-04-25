var async = require('async')
  , config = require('../config')
  , faye = require('faye')
  , models = require('../models')
  , services = require('../services')
  , utils = require('../utils');

exports.index = function(req, res) {
    var query = utils.parseQuery(req);
    var options = utils.parseOptions(req);

    services.agents.find(query, options, function(err, agents) {
        if (err) return res.send(400, err);

        res.send({"agents": agents});
    });
};
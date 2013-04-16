var async = require('async'),
    config = require('../config'),
    faye = require('faye'),
    models = require('../models'),
    services = require('../services');

exports.index = function(req, res) {
    var options = {
        start: 0,
        limit: 25
    };

    services.agents.find(req.query, options, function(err, agents) {
        if (err) return res.send(400, err);

        res.send({"agents": agents});
    });
};
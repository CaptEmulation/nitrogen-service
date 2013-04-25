var async = require('async')
  , config = require('../config')
  , faye = require('faye')
  , models = require('../models')
  ,	services = require('../services');

exports.create = function(req, res) {
    async.concat(req.body, function(message_object, callback) {
        var message = new models.Message(message_object);

        // force message to be from POSTing principal.
        message.from = req.user.id;

        callback(null, [message]);
    }, function (err, messages) {
        services.messages.createMany(messages, function(err, saved_messages) {
            if (err) return res.send(err);
            res.send({ "messages": saved_messages });
        });
    });
};

exports.index = function(req, res) {
    var query = parseQuery(req);
    var options = parseOptions(req);

    services.messages.find(req.user, query, options, function(err, messages) {
        if (err) return res.send(err);

        res.send({ "messages": messages });
    });
};

var parseQuery = function(req) {
    var query = {};
    if (req.query.q) {
        query = JSON.parse(req.query.q);
    }

    return query;
};

var parseOptions = function(req) {
    var options = {};

    if (req.query.options) {
        options = JSON.parse(req.query.options);
    }

    if (!options.limit || options.limit > 1000) options.limit = 1000;
    if (!options.sort) options.sort = { timestamp: -1 };

    return options;
}

exports.remove = function(req, res) {
    var query = parseQuery(req);

    services.messages.remove(req.user, query, function(err, removed) {
        if (err) return res.send(err);

        res.send({ "removed": removed });
    });
};

exports.show = function(req, res) {
    services.messages.findById(req.user, req.params.id, function(err, message) {
        if (err) return res.send(err);
        if (!message) return res.send(404);

        res.send({ "message": message });
    });
};

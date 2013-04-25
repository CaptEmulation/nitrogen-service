var async = require('async')
  , config = require('../config')
  , faye = require('faye')
  , models = require('../models')
  ,	services = require('../services')
  , utils = require('../utils');

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
    var query = utils.parseQuery(req);
    var options = utils.parseOptions(req);

    if (!options.sort) options.sort = { timestamp: -1 };

    services.messages.find(req.user, query, options, function(err, messages) {
        if (err) return res.send(err);

        res.send({ "messages": messages });
    });
};

exports.remove = function(req, res) {
    var query = utils.parseQuery(req);

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

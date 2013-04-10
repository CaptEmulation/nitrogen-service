var config = require('../config')
  , services = require('../services')
  , utils = require('../utils');

exports.health = function(req, res) {
    var status = "ok";
    services.messages.find({}, 0, 1, null, function(err, messages) {
        if (err) status = "failing";

        res.send({ status: status,
                   memory: process.memoryUsage(),
                   remoteAddress: utils.ipFromRequest(req),
                   pid: process.pid,
                   uptime: process.uptime() });
    });
};

exports.ip = function(req, res) {
    var ip = utils.ipFromRequest(req) || "NOIP";

    res.send({ ip: ip });
};
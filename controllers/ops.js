var config = require('../config')
  , services = require('../services')
  , utils = require('../utils');

exports.health = function(req, res) {
    var status = "ok";
    services.messages.find(req.user, {}, { limit: 1 }, function(err, messages) {
        if (err) status = "failing";

        res.send({ status: status,
                   memory: process.memoryUsage(),
                   pid: process.pid,
                   uptime: process.uptime() });
    });
};

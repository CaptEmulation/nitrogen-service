var config = require('../config')
  , services = require('../services');

exports.health = function(req, res) {
    var status = "ok";
    services.messages.find({}, 0, 1, null, function(err, messages) {
        if (err) status = "failing";

        res.send({status: status,
                  memory: process.memoryUsage(),
                  pid: process.pid,
                  uptime: process.uptime()});
    });
};
var sendPairingMessage = function(user, device) {

  models.Message.where('message_type').equals('pairing')
      .where('from').equals(device.id)
      .where('to').equals(user.id)
      .exec(function(err, messages) {

        // if we haven't already emitted a pairing message
        if (messages.length == 0) {
          var pairingExpiration = new Date();
          pairingExpiration.setDate(pairingExpiration.getDate() + 1);

          var message = new Message({
            from: device.id,
            to: user.id,
            message_type: 'pairing',
            expires: pairingExpiration
          });

          message.save(function(err, message) {
              if (err) {
                  console.log("pairing message save failed");
              }
          });
        }
      });
};

var pairingSearch = function(message) {
    var earliestSearchTime = new Date();
    earliestSearchTime.setDate(earliestSearchTime.getDate() - 1);

    models.Message.where('message_type').equals('ip')
        .where('body.address').equals(message.body.address)
        .where('timestamp').gt(earliestSearchTime)
        .populate('from')
        .exec(function(err, messages) {

            var unpairedDevices = {};
            var usersFromIp = {};
            messages.forEach(function(message) {

                // retain devices without a pair.
                if (message.from.is('device') && !message.from.owner) {
                  unpaired_devices[message.from.id] = message.from;
                } else if (message.from.is('user')) {
                  usersFromIp[message.from.id] = message.from;
                }
            });

            // if more than one user or none has come from this IP address in last 24 hours,
            // we can't autopair.
            if (usersFromIp.keys.length != 1) {
              return;
            }

            var user = usersFromIp.values[0];

            // Aggressive autopairing strategy - if we have exactly one user from IP, offer to
            // autopair any devices from that same IP.
            unpairedDevices.values.forEach(function(device) {
              sendPairingMessage(user, device);
            });
        });
};

module.exports = new Agent({ observes: [{message_type: 'ip'}],
                              script:   pairingSearch });
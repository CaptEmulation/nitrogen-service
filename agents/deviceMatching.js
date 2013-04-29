function createIpMatchMessage(session, user, device, callback) {
    log.info("deviceMatch: creating ip_match message for device: " + device.id);

    // ip match messages should be only visible to the device and the user
    // so that only the user can claim the device.
    var matchMessage = new nitrogen.Message({ message_type: "ip_match",
                                              from: device.id,
                                              to: user.id,
                                              public: false
    });

    var IPMATCH_KEY_BYTES = 10;
    crypto.randomBytes(IPMATCH_KEY_BYTES, function(err, secretBuf) {
        if (err) return callback(err, null);

        matchMessage.body.key = secretBuf.toString('base64');

        matchMessage.save(session, callback);
    });
}

function completionCallback(err) {
    if (err) log.error("createIPMatchMessage finished with an error: " + err);
}

session.onMessage(function(message) {

    if (message.message_type == "ip") {
        log.info("deviceMatch: agent processing ip message");

        nitrogen.Principal.find(session, { last_ip: message.body.ip_address }, function(err, principalsAtIp) {
            var devices = [];
            var users = [];

            principalsAtIp.forEach(function(principal) {
                if (principal.isUser())
                    users.push(principal);
                else if (principal.isDevice())
                    devices.push(principal);
            });

            log.info("deviceMatch: users length: " + users.length + " devices length: " + devices.length);

            if (users.length != 1) return;  /* don't match devices if more than one (or no) user at this IP address. */

            nitrogen.Principal.find(session, { _id: message.from }, function(err, fromPrincipals) {
                if (err) return log.error("deviceMatch: didn't find principal: " + err);

                var fromPrincipal = fromPrincipals[0];

                /* for device 'ip' messages we only generate one ip_match message from the user to that device. */

                if (fromPrincipal.principal_type == "user") {
                    /* for each device at this IP address that is not currently owned by a principal, emit an ip_match message. */
                    var user = fromPrincipal;
                    async.each(devices, function(device, callback) {
                       if (!device.owner) createIpMatchMessage(session, user, device, callback);
                    }, completionCallback);

                } else {
                    /* create an ip_match message for this device. */
                    var device = fromPrincipal;
                    if (!device.owner) createIpMatchMessage(session, users[0], device, completionCallback);
                }

            });

        });
    }

});
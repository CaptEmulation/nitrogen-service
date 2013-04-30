function createIpMatchMessage(session, user, device, callback) {
    nitrogen.Message.find(session, { 
        from: user.id,
        message_type: "reject",
        body: { principal: device.id } 
    }, function(err, messages) {
        if (err) return callback(err);
        if (messages.length > 0) {
            log.info("deviceMatch: reject message exists for user: " + user.id + " and device: " + device.id + " not creating ip_match");
            return callback(null, null);
        }

        nitrogen.Message.find(session, {
            message_type: "ip_match",
            body: { principal: device.id }
        }, function(err, messages) {
            if (err) return callback(err);
            if (messages.length > 0) {
                log.info("deviceMatch: ip_match message exists for device: " + device.id + " not creating ip_match");
                return callback(null, null);
            }


            log.info("deviceMatch: creating ip_match message for device: " + device.id);

            var matchMessage = new nitrogen.Message({ 
                message_type: "ip_match",                                                
                to: user.id,
                body: {
                    principal: device.id
                }
            });

            matchMessage.save(session, callback);
        });
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
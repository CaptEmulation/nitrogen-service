function createIpMatchMessage(user, device) {
    var matchMessage = new nitrogen.Message({ message_type: "ip_match" });
    matchMessage.from = device;
    matchMessage.to = user;

    matchMessage.save(session);
}

if (message.message_type == "ip") {
    nitrogen.Principal.find(session, { 'last_ip': message.body.ip_address }, function(err, principalsAtIp) {
        if (err) return;

        var devices = []
        var users = [];

        principalsAtIp.forEach(function(principal) {
            if (principal.isUser())
                users.push(principal);
            else if (principal.isDevice())
                devices.push(principal);
        });

        if (users.length != 1) return;  /* don't match devices if more than one (or no) user at this IP address. */

        /* for device 'ip' messages we only generate one ip_match message from the user to that device. */

        if (message.from.isUser()) {
            /* for each device at this IP address that is not currently owned by a principal, emit an ip_match message. */

            devices.forEach(function(device) {
               if (!device.owner) createIpMatchMessage(session, message.from, device);
            });

        } else {
            if (!message.from.owner) createIpMatchMessage(session, users[0], message.from);
        }
    });
}

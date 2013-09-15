function pairDeviceWithOwner(device, owner) {
    log.info('device id: ' + device.id + ' automatically matched to owner: ' + owner.id);

    device.owner = owner.id;
    device.claim_code = null;
    
    device.save(session);
}

function matchUnownedDevices(message, devices, users) {
    nitrogen.Principal.find(session, { _id: message.from }, {}, function(err, fromPrincipals) {
        if (err) return log.error("matcher: error finding principal: " + err);
        if (fromPrincipals.length === 0) return log.warn("matcher: didn't find principal with id (possibly deleted in the meantime?): " + message.from);

        var fromPrincipal = fromPrincipals[0];

        if (fromPrincipal.is('user')) {
            async.each(devices, function(device, callback) {
                if (!device.owner) {
                    pairDeviceWithOwner(device, fromPrincipal);
                } else {
                    log.info('matcher: device id: ' + device.id + ' already has owner: ' + device.owner);
                }
            }, function(err) {
                if (err) log.error("matcher: matchUnownedDevices finished with an error: " + err);
            });
        } else {
            var device = fromPrincipal;
            if (!device.owner) {
                pairDeviceWithOwner(device, users[0]);
            } else {
                log.info('matcher: device id: ' + device.id + ' already has owner: ' + device.owner);
            }
        }
    });
}

function processIpMessage(message) {
    var yesterday = new Date();
    yesterday.setDate(-1);

    var filter = {
        last_ip: message.body.ip_address,
        last_connection: { $gt: yesterday }
    };

    nitrogen.Principal.find(session, filter, {}, function(err, principalsAtIp) {
        if (err) return log.error('matcher: error looking for principals at this ip address: ' + err);
        var devices = [];
        var users = [];

        principalsAtIp.forEach(function(principal) {
            log.info("matcher: principal at ip: " + principal.type + ":" + principal.id);

            if (principal.is('user'))
                users.push(principal);
            else if (principal.is('device'))
                devices.push(principal);
        });

        log.info("matcher: users length: " + users.length + " devices length: " + devices.length);

        if (users.length != 1) return log.info("matcher: not exactly one user at this ip address. can't match devices.");

        matchUnownedDevices(message, devices, users);
    });
}

session.on({ type: 'message', filter: { type: 'ip' } }, processIpMessage);
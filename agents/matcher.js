function pairDeviceWithOwner(device, principal) {
    log.info('device id: ' + device.id + ' automatically matched to owner: ' + principal.id);

    var permissions = [
        new nitrogen.Permission({
            type: 'admin',
            issued_to: principal.id,
            principal_for: device.id,
            priority: nitrogen.Permission.NORMAL_PRIORITY
        }),
        new nitrogen.Permission({
            type: 'send',
            issued_to: principal.id,
            principal_for: device.id,
            priority: nitrogen.Permission.NORMAL_PRIORITY
        }) 
    ];

    async.each(permissions, function(permission, cb) {
        permission.create(session, cb);
    }, function(err) {
        if (err) return log.error("matcher: didn't successfully save permissions.");

        device.owner = principal.id;
        device.claim_code = null;

        device.save(session, function(err, principal) {
            if (err) log.error("matcher: updating claimed principal failed: " + err);

            log.info("matcher: successfully set " + device.id + " as the owner of " + principal.id);
        });            
    });

    
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

session.on({ type: 'message', filter: { type: 'ip' } }, function(message) {
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
});
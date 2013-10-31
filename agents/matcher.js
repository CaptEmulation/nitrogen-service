function matchDevice(device, principal, callback) {
    log.info('matcher: device id: ' + device.id + ' has no admins, adding admin rights for principal: ' + principal.id);

    var permissions = [
        new nitrogen.Permission({
            authorized: true,
            action: 'admin',
            issued_to: principal.id,
            principal_for: device.id,
            priority: nitrogen.Permission.NORMAL_PRIORITY
        }),
        new nitrogen.Permission({
            authorized: true,
            action: 'subscribe',
            issued_to: principal.id,
            principal_for: device.id,
            priority: nitrogen.Permission.NORMAL_PRIORITY
        }),
        new nitrogen.Permission({
            authorized: true,
            action: 'send',
            issued_to: principal.id,
            principal_for: device.id,
            priority: nitrogen.Permission.NORMAL_PRIORITY
        }) 
    ];

    async.each(permissions, function(permission, cb) {
        permission.create(session, cb);
    }, function(err) {
        if (err) {
            return callback("didn't successfully save permissions.");
        }

        device.claim_code = null;

        device.save(session, function(err, principal) {
            if (err) {
                log.error("matcher: updating claimed principal failed: " + err);
            } else {
                log.info("matcher: successfully set " + principal.id + " as the admin of " + device.id);
            }

            return callback();
        });            
    });
}

function matchIfNoAdmin(device, principal, callback) {
    nitrogen.Permission.find(session, { principal_for: device.id, action: 'admin' }, {}, function(err, permissions) {
        if (permissions.length === 0) {
            matchDevice(device, principal, callback);
        } else {
            log.info('matcher: device id: ' + device.id + ' already has admin(s): not matching.');
            return callback();
        }
    });    
}

function matchDevices(message, devices, user, callback) {

    // check to see who changed IP address, was it the device or the user?
    nitrogen.Principal.find(session, { _id: message.from }, {}, function(err, fromPrincipals) {
        if (err) return callback("error finding principal: " + err);
        if (fromPrincipals.length === 0) return callback("didn't find principal with id: " + message.from);

        var fromPrincipal = fromPrincipals[0];

        // if the user switched IP address, we match all devices at this IP address.
        // if the device switched IP address, we match that device to this user.
        if (fromPrincipal.is('user')) {
            async.each(devices, function(device, cb) {
                matchIfNoAdmin(device, fromPrincipal, cb);
            }, callback);
        } else {
            matchIfNoAdmin(fromPrincipal, user, callback);
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

        matchDevices(message, devices, users[0], function(err) {
            if (err) log.error("matcher: " + err);
        });
    });
});

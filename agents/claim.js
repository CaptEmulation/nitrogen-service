session.on({ type: 'message', filter: { type: 'claim' }, name: 'claimAgent' }, function(message) {
    if (!message.body.claim_code) {
        log.error("claimAgent: no claim_code provided in claim request sent by " + message.from);
        return;
    }

    nitrogen.Principal.find(session, { claim_code: message.body.claim_code }, {}, function(err, principals) {
        if (err || principals.length === 0) {
            log.warn("claimAgent: didn't find principal with claim code: " + message.body.claim_code);
            return;            
        }

        var claimedPrincipal = principals[0];

        var permissions = [
            new nitrogen.Permission({
                authorized: true,
                issued_to: message.from,
                principal_for: claimedPrincipal.id,
                priority: nitrogen.Permission.NORMAL_PRIORITY
            })
        ];

        async.each(permissions, function(permission, cb) {
            permission.create(session, cb);
        }, function(err) {
            if (err) return log.error("claimAgent: didn't successfully save permissions.");

            claimedPrincipal.claim_code = null;

            claimedPrincipal.save(session, function(err, principal) {
                if (err) log.error("claimAgent: updating claimed principal failed: " + err);

                log.info("claimAgent: successfully gave " + message.from + " wildcard rights to " + principal.id);
            });            
        });
    });
});

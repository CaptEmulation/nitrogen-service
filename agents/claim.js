session.onMessage({ type: 'claim' }, function(message) {
    if (!message.body.claim_code) {
        log.error("claimAgent: failed principal claim with NULL code (shouldn't happen).");
        return;
    }

    nitrogen.Principal.find(session, { claim_code: message.body.claim_code }, {}, function(err, principals) {
        if (err || principals.length === 0) {
            log.warn("claimAgent: didn't find principal with claim code: " + message.body.claim_code);
            return;            
        }

        var claimedPrincipal = principals[0];

        var permissions = [
/*          new nitrogen.Permission({
                type: 'admin',
                issued_to: message.from,
                principal_for: claimedPrincipal.id,
                priority: nitrogen.Permission.NORMAL_PRIORITY
            },
            new nitrogen.Permission({
                type: 'send',
                issued_to: message.from,
                principal_for: claimedPrincipal.id,
                priority: nitrogen.Permission.NORMAL_PRIORITY
            }) */
        ];

        async.each(permissions, function(permission, cb) {
            permission.save(cb);
        }, function(err) {
            if (err) return log.error("claimAgent: didn't successfully save permissions.");

            claimedPrincipal.owner = message.from;
            claimedPrincipal.claim_code = null;

            claimedPrincipal.save(session, function(err, principal) {
                if (err) log.error("claimAgent: updating claimed principal failed: " + err);

                log.info("claimAgent: successfully set " + message.from + " as the owner of " + principal.id);
            });            
        });
    });
});
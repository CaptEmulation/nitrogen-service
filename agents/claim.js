session.onMessage({ type: 'claim' }, function(message) {
    if (!message.body.claim_code) {
        log.error("claimAgent: failed principal claim with NULL code (shouldn't happen).");
        return;
    }

    nitrogen.Principal.find(session, { claim_code: message.body.claim_code }, {}, function(err, principals) {
        if (err || principals.length === 0) {
            log.info("claimAgent: failed principal claim with code: " + message.body.code);
            return;            
        }

        var claimedPrincipal = principals[0];
        
        claimedPrincipal.owner = message.from;
        claimedPrincipal.claim_code = null;

        claimedPrincipal.save(session, function(err, principal) {
            if (err) log.error("claimAgent: updating claimed principal failed: " + err);

            log.info("claimAgent: successfully set " + message.from + " as the owner of " + principal.id);
        });
    });
});
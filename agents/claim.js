session.onMessage(function(message) {
    if (message.is('claim')) {
        log.info("claimAgent: claim agent processing message: " + message.id + " : " + message.to);

        nitrogen.Message.find(session, { _id: message.response_to }, function(err, ipMatches) {

            if (err || ipMatches.length == 0) {
                log.error("claimAgent: couldn't find ip_match claim was in response to, ignoring request.");
                return;
            }

            var ipMatch = ipMatches[0];

            if (ipMatch.to !== message.from) {
                log.error("claimAgent: user trying to claim principal does not match ip match message, ignoring.");
                return;
            }

            nitrogen.Principal.find(session, { _id: message.body.principal }, function(err, claimedPrincipals) {
                if (err || !claimedPrincipals || claimedPrincipals.length == 0) {
                    log.error("claimAgent: couldn't find principal that claim was targeted to: " + err);
                    return;
                }

                var claimedPrincipal = claimedPrincipals[0];

                if (claimedPrincipal.owner) {
                    log.warn("claimAgent: principal " + claimedPrincipal.id + " is already owned by " + claimedPrincipal.owner + ": ignoring claim request.");
                    return;
                }

                claimedPrincipal.owner = message.from;
                claimedPrincipal.update(session, function(err, principal) {
                    if (err) log.error("claimAgent: updating claimed principal failed: " + err);

                    log.info("claimAgent: successfully set " + message.from + " as the owner of " + principal.id);
                });
            });
        });
    }
});
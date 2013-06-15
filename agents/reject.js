session.onMessage(function(message) {
    if (message.is('reject') && message.response_to.length > 0) {
        log.info("rejectAgent: processing message");
        nitrogen.Message.find(session, { _id: message.response_to[0] }, {}, function(err, ipMatches) {

            if (err || ipMatches.length == 0) {
                log.error("claimAgent: couldn't find ip_match claim was in response to, ignoring request.");
                return;
            }

            var ipMatch = ipMatches[0];

            if (ipMatch.to !== message.from) {
                log.error("claimAgent: user trying to claim principal does not match ip match message, ignoring.");
                return;
            }

            ipMatch.remove(session);
        });
    }
});

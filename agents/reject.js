session.onMessage({ type: 'reject' }, function(message) {
    if (message.response_to.length > 0) {
        log.info("reject: processing message");
        nitrogen.Message.find(session, { _id: message.response_to[0] }, {}, function(err, ipMatches) {

            if (err || ipMatches.length == 0) {
                log.error("reject: couldn't find ip_match claim was in response to, ignoring request.");
                return;
            }

            var ipMatch = ipMatches[0];

            if (ipMatch.to !== message.from) {
                log.error("reject: user trying to claim principal does not match ip match message, ignoring.");
                return;
            }

            ipMatch.remove(session);
        });
    }
});

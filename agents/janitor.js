log.info("janitor agent starting");

setInterval(function() {

    log.info("janitor agent running");

    var expiredMessagesQuery = { expires: { $lt: new Date() } };
    log.info("expired query: " + JSON.stringify(expiredMessagesQuery));

    // Nitrogen service will automatically remove linked resources (eg. blobs).

    nitrogen.Message.remove(session, expiredMessagesQuery, function(err, removed) {
        if (err) return log.error("Removing expired messages in janitor failed: " + err);

        log.info("janitor removed " + removed + " messages");
    });

}, 61 * 1000);
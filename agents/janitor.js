function janitorIteration() {

    log.info("janitor agent running");

    var expiredMessagesQuery = { expires: { $lt: new Date() } };

    // Nitrogen service will automatically remove linked resources (eg. blobs).

    nitrogen.Message.remove(session, expiredMessagesQuery, function(err, removed) {
        if (err) return log.error("Removing expired messages in janitor failed: " + err);

        log.info("janitor removed " + removed + " messages");
    });

}

setInterval(janitorIteration, 61 * 1000);
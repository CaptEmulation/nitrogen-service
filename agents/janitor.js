function janitorIteration() {

    var expiredMessagesQuery = { expires: { $lt: new Date() } };

    // Nitrogen service will automatically remove linked resources (eg. blobs).

    nitrogen.Message.remove(session, expiredMessagesQuery, function(err, removed) {
        if (err) return log.error("janitor execution failed: " + err);

        log.info("janitor execution finished:  removed " + removed + " messages");
    });

}

setInterval(janitorIteration, 61 * 1000);
function janitorIteration() {
    // Nitrogen service will automatically remove linked resources (ie. blobs).

    nitrogen.Message.remove(session, { expires: { $lt: new Date() } }, function(err, removed) {
        if (err) return log.error("janitor execution failed: " + err);

        log.info("janitor execution finished:  removed " + removed + " messages");
    });
}

setInterval(janitorIteration, 61 * 1000);
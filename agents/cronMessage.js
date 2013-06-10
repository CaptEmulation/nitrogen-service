if (params && params.message && params.schedule && params.time_zone) {
    new cron.CronJob({
        cronTime: params.schedule,
        timeZone: params.time_zone,
        onTick: function() {
            var message = new nitrogen.Message(params.message);
            message.save(session);

            log.info('cronMessage: sent message: ' + JSON.stringify(params.message));
        }
    }).start();
    log.info('cronMessage agent: setup message send with schedule ' + params.schedule + ' in timezone: ' + params.time_zone + ' with message: ' + JSON.stringify(params.message));
} else {
    log.error('cronMessage agent: incomplete parameters provided.');
}
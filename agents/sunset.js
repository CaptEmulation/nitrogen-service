function setupSnapshots() {
    var times = suncalc.getTimes(new Date(), 36.9742, -122.0297);
    var message = new nitrogen.Message({
        to: "51af4e62d185a4bd23000013",
        ts: times.sunset,
        type: "cameraCommand",
        body: {
            command: "snapshot"
        }
    });

    log.info('sending sunset snapshot command for ' + times.sunset);

    message.save(session);

//    async.waterfall([
//        findLastLocation,
//        sendMessage
//    ]);
}

function findLastLocation(callback) {
    nitrogen.Message.find(session, { type: 'location', from: params.camera_id }, function(err, messages) {
        if (err) return callback(err);

        if (!messages) {
            messages = [
                new nitrogen.Message({
                    type: 'location',
                    from: params.camera_id,
                    body: {
                        latitude: 36.9742,
                        longitude: 122.0297
                    }
                })
            ];
        }

        callback(null, messages[0]);
    });
}

function sendMessage(location, callback) {
    var times = suncalc.getTimes(new Date(), location.body.latitude, location.body.longitude);
    var message = new nitrogen.Message({
        type: "cameraControl",
        ts: times.sunset,
        body: {
            command: "snapshot"
        }
    });

    message.save(session, callback);
}

// setup the day's sunset photo at 1am PST every morning.
// 1am in Los Angeles is not a common sunrise/sunset time anywhere populated in the world (sorry American Samoa)
new cron.CronJob({
    cronTime: '01 00 00 * * *',
    timeZone: 'America/Los_Angeles',
    onTick: setupSnapshots
}).start();

setupSnapshots();

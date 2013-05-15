// TODO: pass this in from agent config
var params = {
    camera_id: "51841170e9e1dd2c2e000007"
};

// setup the day's sunset photo at 1am PST every morning.
// midnight in Los Angeles is not a common sunrise/sunset time anywhere populated in the world (sorry American Samoa)
new cron.cronJob({
    cronTime: '01 00 00 * * *',
    timeZone: 'America/Los_Angeles',
    onTick: setupSnapshots
});

function setupSnapshots() {
    async.waterfall([
        findLastLocation,
        sendMessage
    ]);
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
        type: "camera_control",
        timestamp: times.sunset,
        body: {
            command: "snapshot"
        }
    });

    message.send(session, callback);
}
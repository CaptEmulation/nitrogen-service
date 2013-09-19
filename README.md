# Nitrogen Service

Nitrogen is a platform for building connected devices.  Nitrogen provides the authentication, authorization, and realtime communications framework so that you can focus on your device and/or application.  All with a consistent development platform that leverages the ubiquity of Javascript.

## Device Development Model

Nitrogen at its heart uses messaging between principals. Messages can follow a well known schema to enable interoperability between applications or use their own private custom message types for specialized applications.

For example, a thermometer that measures temperature once every 15 minutes could be implemented in Nitrogen like this:

``` javascript
var thermometer = new nitrogen.Device({ nickname: "thermometer",
                                        capabilities: [ "temperature" ] });

var service = new nitrogen.Service(config);
service.connect(thermometer, function(err, session, thermometer) {

	// take temperature every 15 minutes.

    setInterval(function() {
        var message = new nitrogen.Message({
            from: session.principal.id,
            type: 'temperature',
            body: {
                temperature: getTemp()
            }
        });

        message.send(session);
    }, 15 * 60 * 1000);

});
```

You can find a complete example for a device application of Nitrogen in the [camera](https://github.com/nitrogenjs/camera) project.

Current message schemas are futher defined in [docs/schema.md](docs/schemas.md).

## Listening to a device's message stream

An application that displays these temperatures in real time as they are received would look like this.  In this case,
we're using a user principal, and a filter with onMessage to only notify us of temperature updates.

``` javascript
var user = new nitrogen.User({...});

var service = new nitrogen.Service(config);
service.connect(user, function(err, session, user) {
    session.onMessage({ type: 'temperature' }, function(message) {
        console.log("The temperature is now: " + message.body.temperature);

        // update the UI
    });
});
```

## Getting Started

There is a free hosted Nitrogen service running in the cloud if you'd like to get started quickly with building a device.  Go to [https://admin.nitrogen.io](https://admin.nitrogen.io) to sign up for an account and get started.

If at any time you run into issues, the IRC channel #nitrogen.js on irc.freenode.net contains folks willing to help or just file an issue with this project.  It is incredibly helpful to know what is hard for beginners to understand so please don't hesitate to reach out.

To run a Nitrogen service locally:

1. Clone or fork this repo: `https://github.com/nitrogenjs/service`
2. Fetch and install its node.js dependencies: `npm install`
3. Install mongodb locally.
4. Edit `config.js` to change defaults as necessary.
5. `node server.js`

## Running tests

1. `npm install -g mocha`
2. `mocha`

## How to contribute

1.  Feedback:  We'd love feedback on what problems you are using Nitrogen to solve.  Obviously, we'd also like to hear about where you ran into sharp edges and dead ends.   Let us know on IRC or file an issue.
2.  Pull requests:  If you'd like to tackle an issue, fork the repo, create a clean commit for the fix or enhancement (with tests if new ones are required), and send us a pull request.

## Other Projects

Nitrogen has three other that you should have a look at as well.

1. [client](https://github.com/nitrogenjs/client): The client library for building Nitrogen devices and applications.
2. [admin](https://github.com/nitrogenjs/admin): An administrative tool for managing the Nitrogen service.
3. [camera](https://github.com/nitrogenjs/camera): A sample device application that connects a camera to the Nitrogen service.
# Magenta

Magenta makes it easy to develop connected realtime devices, agents that can react and direct these devices, and to discover and compose devices from different creators together into coherent applications.  Magenta provides the authentication, authorization, event logging, device provisioning, and real time message passing framework so that you can focus on your device and/or your application.  All with a consistent development platform that leverages the ubiquity of Javascript.  Magenta is the internet of things made simple.

## Device Development Model

Magenta at its heart uses messaging between principals (devices, applications, users).  Principals in
the system can create and consume messages.  Messages can follow a well known schema to enable interoperability between
applications or use their own private custom message types.

For example, a thermometer that measures temperature once every 15 minutes could be implemented in Magenta like this:

``` javascript
var thermometer = new magenta.Device({ local_id: "thermometer",
                                       capabilities: [ "thermometer" ] });

var service = new magenta.Service(config);
service.connect(thermometer, function(err, session, thermometer) {

	// take temperature every 15 minutes.

    setInterval(function() {
        var message = new magenta.Message();
        message.from = session.principal.id;
        message.message_type = "temperature";
        message.body.temperature = getTemp();

        message.save(session);
    }, 15 * 60 * 1000);

});
```

You can find a complete example for a device application of Magenta in the `chroma` project.

## Application Development Model

Let's say that we wanted to build a web application that displays these temperatures in real time as they are received.  You could do that with something like this:

var user = new magenta.User();

var service = new magenta.Service(config);
service.connect(user, function(err, session, user) {

    session.onMessage(function(message) {
        console.log("The temperature is now: " + message.body.temperature);

        // update the UI

        if (message.body.temperature < 15) {
        	// emit a control message to the furnance to turn it on.
        }
    });
});

A great example for understanding the Magenta application model is the `admin` project.

## Getting Started

To get started with a Magenta service locally:

1. Clone or fork this repo: `https://github.com/magentajs/service`
2. Fetch and install its node.js dependencies: `npm install`
3. Install mongodb locally (if necessary).
4. Edit `config.js` to change defaults as necessary.
5. Create an account on Windows Azure and a storage account.  Set the environmental variables AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY to your credentials respectively such that these are available at runtime.
6. `node server.js`

## Running tests

1. `npm install -g mocha`
2. `mocha`

## How to contribute

1.  Feedback:  We'd love feedback on where you ran into sharp edges, dead ends, and what problems you are trying to solve with Magenta.   Drop me a message at timfpark@gmail.com or file an issue with us above.
2.  Pull requests:  If you'd like to tackle an issue, fork the repo, create a clean commit for the fix or enhancement with tests if necessary, and send us a pull request.   This is also the path to becoming a core committer for the project for folks that are interested in contributing in more depth.
3.  Documentation:  Teaching people how to use and run the service is incredibly important.  We'd love to have more help and this is one of the most valuable contributions you can make.

## Other Projects

Magenta has two other projects that you should have a look at as well.

1. admin: An administrative tool that helps you manage devices and users.
2. client: The client library for building Magenta devices and applications.
3. chroma: A sample device application that uploads photos to the service from a device running the Debian package 'motion'.
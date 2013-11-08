# Nitrogen Service

Nitrogen is a platform for building connected devices.  Nitrogen provides the authentication, authorization, and realtime messaging platform so that you can focus on your device and/or application.  All with a consistent development platform that leverages the ubiquity of Javascript.  You can learn more about the project's goals at a high level from [my talk at LXJS.](https://www.youtube.com/watch?v=xV0x3boaZwU)

## Device Development Model

Nitrogen at its heart uses messaging between principals. Messages can follow a well known schema to enable interoperability between applications or use their own private custom message types for specialized applications. Devices and applications follow and send messages to each other in a manner you can think of mentally as "Twitter for Devices."

For example, let's say that you wanted to build a connected camera using Nitrogen.  In Nitrogen, this would look something like this:

``` javascript
var service = new nitrogen.Service(config);

var camera = new RaspberryPiCamera({
      nickname: 'living_room',
      width: 1024,
      height: 768
});

service.connect(config.camera, function(err, session, camera) {
    if (err) { return console.log('failed to connect camera: ' + err); }

    // startup opencv based camera manager (supports software based motion detection) for this camera. 
    new OpenCVCameraManager(camera).start(session, { $or: [ { to: camera.id }, { from: camera.id } ] }, function(err, message) {
        if (err) return session.log.error(JSON.stringify(err));
    });

    callback();
});
```

The service.connect() call in this example handles all the authentication and realtime communication details and encapsulates these in a session object that you pass to functions that communicate with a Nitrogen service.

It also starts up a CommandManager for the camera.  A CommandManager in Nitrogen follows the message stream for the device and react to commands sent to it by typically controlling a device associated with it.  In this case, we are starting a OpenCVCameraManager and passing in a Nitrogen device for a Raspberry Pi camera.  This manager will watch for cameraCommand messages and execute them against them against this camera.

CommandManager are mixed into a service or device project so that you can choose which commands you want your service and devices to support.  The Nitrogen project maintains a set of standard commands in the [commands](http://github.com/nitrogenjs/commands) subproject but you are free to define your own and mix them in as well.  Have a look at the definition of one of these command packages and package.json for the service project for a template for how to do that.

The sample camera application above can be found in the [camera](https://github.com/nitrogenjs/camera) project.   This project uses the [Nitrogen client node.js module](http://github.com/nitrogenjs/client) to communicate with the service.  There is full API documentation for this library available at [https://api.nitrogen.io/docs/](https://api.nitrogen.io/docs/).

Nitrogen also maintains a set of standard schemas to enable cross application / device interoperability.  See [docs/schema.md](docs/schemas.md).  To make a proposal for a new schema, make a pull request against this documentation subtree.

Finally, Nitrogen also maintains a set of device modules (like the Raspberry Pi camera above) in the [devices](https://github.com/nitrogenjs/ic) subproject.  You are obviously welcome to maintain your own device projects seperately or submit a pull request to add one to this project.

## A simple Nitrogen application example

Let's say that we wanted write an application that asked this camera device we have created to take a picture of the sunset tonight.  In Nitrogen, an application that does this would look something like this:

``` javascript
var times = SunCalc.getTimes(new Date(), 36.972, -122.0263);
            
var expireTime = new Date(times.sunset.getTime() + 5 * 60000);

var cmd = new nitrogen.Message({
  to: camera.id,
  type: 'cameraCommand',
  ts: times.sunset,
  expires: expireTime,
  body: {
      command: 'snapshot'
  }
});

cmd.send(session);
```

In this example, we use the excellent SunCalc node.js module to calculate the sunset time and then build a cameraCommand message.  Note that we set the timestamp of this command message to the sunset.  In Nitrogen, a CommandManager executes a command when the timestamp matches the current time.  This allows us to predeliver these command messages to the device and have it execute them at the appropriate time.  This is important because many devices for connectivity or battery reasons will not be continously connected to the Nitrogen service to receive messages and this allows us to still have precise control of a device.

We also set a expires timestamp on this message for 5 minutes after the sunset.  CommandManagers will not execute commands that have expired so this signals that if the camera for whatever reason does not get this message withparkin 5 minutes of the sunset that it should not take a picture.

## Getting Started

There is a free hosted Nitrogen service running in the cloud if you'd like to get started quickly with building a device.  Go to [https://admin.nitrogen.io](https://admin.nitrogen.io) to sign up for an account and then follow the [first devicewalkthrough](docs/walkthrough.md) to see how to get a device up and running.

If at any time you run into issues, plesae file an issue with this project or email me directly at timfpark@gmail.com.  It is incredibly helpful to know what is hard for beginners to understand so please don't hesitate to reach out.

To run a Nitrogen service locally:

1. Clone or fork this repo: `https://github.com/nitrogenjs/service`
2. Fetch and install its node.js dependencies: `npm install`
3. Install mongodb locally.
4. Edit `config.js` to change defaults as necessary.
5. `node server.js`

## Running tests

1. `npm test`

## How to contribute

1.  Feedback:  We'd love feedback on what problems you are using Nitrogen to solve.  Obviously, we'd also like to hear about where you ran into sharp edges and dead ends.   Let us know by filing an issue with the project.
2.  Pull requests:  If you'd like to tackle an issue, fork the repo, create a clean commit for the fix or enhancement (with tests if new ones are required), and send us a pull request.

## Other Projects

Nitrogen has three other that you should have a look at as well.

1. [client](https://github.com/nitrogenjs/client): The client library for building Nitrogen devices and applications.
2. [admin](https://github.com/nitrogenjs/admin): An administrative tool for managing the Nitrogen service.
3. [camera](https://github.com/nitrogenjs/camera): A sample device application that connects a camera to the Nitrogen service.
4. [commands](https://github.com/nitrogenjs/commands): Project managed commandManagers and schemas for different command types.
5. [device](https://github.com/nitrogenjs/devices): Project managed devices for common pieces of hardware.
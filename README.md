# Magenta

Magenta makes it easy to build connected devices. Magenta provides authentication, authorization, event logging,
device provisioning, and real time message passing so that you can focus on building your device.


## Simple

We also aim to provide a simple development model.

For example, a thermometer that measures temperature once every 15 minutes could be implemented in Magenta like this:

``` javascript
var thermometer = new magenta.Device({ local_id: "thermometer",
                                       capabilities: [ "thermometer" ] });

var service = new magenta.Service(config);
service.connect(thermometer, function(err, session, thermometer) {

    setInterval(function() {
        var message = new magenta.Message();
        message.from = session.principal.id;
        message.message_type = "temperature";
        message.body.temperature = getTemp();

        message.save();
    }, 15 * 60 * 1000);

});
```

Magenta at its heart is a message passing system between principals (devices, applications, users).  Principals in
the system create and consume messages.  Messages can follow a well known schema to enable interoperability between
applications or use their own private custom message types.
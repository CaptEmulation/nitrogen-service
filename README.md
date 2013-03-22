# Magenta

Magenta is a framework that makes it easy to get devices communicating. In building any connected device, there is an
large amount of boilerplate infrastructure that you have to build:  authentication schemes, event logging, device provisioning,
data synchronization, and device control.  Magenta aims to provide this for you so you can focus on the differentiated
parts of your device, application, or service.

## Simple

For example, a thermometer that measures temperature once every 15 minutes could be implemented in Magenta like this:

``` javascript
var thermometer = new magenta.Device({ local_id: "thermometer",
                                       capabilities: "thermometer" });

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
the system create and consume messages.  Messages use a system wide schema.

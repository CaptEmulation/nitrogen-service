# heartbeat Schema

A heartbeat message relays device status to the service.

* error (boolean, required): The device is in an error condition. The optional status field may contain more information.
* status (object, optional): An optional and schema-less status object that contains more information about the current state of the device.
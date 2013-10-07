# Message Schemas

Nitrogen defines a set of message schemas for interoperability between devices and applications.

Messages that start with an underscore ("_") are custom messages and the schema for them will not be validated. This enables private communication between devices and applications of the same manufacturer. Non-custom messages, however, have a well known schema that the service must be able to verify or it will be rejected. This document covers the defined list of well known schemas. If you need a schema that hasn't been defined yet or would like to propose a change or extension to an existing schema, please submit a pull request for the appropriate markdown file.

Every message includes the following fields:
* type: The type of message, which is also the schema its body uses.
* ver: The version of the schema used in the message body.
* ts: A timestamp that expresses when this message took/will take place.  If not assigned, will default to the timestamp when message is received by the service.
* expires: When this message expires.  If not assigned, will default to the default message lifetime that the service has configured.
* from: The id of the principal this message is from.
* to: The id of the principal this message is to (if any).
* response_to: Array of messages this message is in response to.
* link: If this message references resources, this link will be applied to those resources for cross referencing.
* body: The body of the message.  If the schema is well known, the body should follow the schema as defined below.

## Control
* [cameraCommand](schema/cameraCommand.md)

## Internals
* [claim](schema/claim.md)
* [heartbeat](schema/heartbeat.md)
* [ip](schema/ip.md)
* [log](schema/log.md)

## Media
* [image](schema/image.md)

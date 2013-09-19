# cameraCommand Schema

cameraCommand messages relay camera control commands to devices with that capability.  Required fields:

* command (string, required): The command that the camera should execute. Should be one of:
    * snapshot: One-shot snapshot.  Camera should execute snapshot as soon as possible to the timestamp specified and send an `image` message with response_to set to this cameraCommand.
    * motion: Detect motion until expiration. Camera should start motion detection as close as possible to the timestamp specified and send `image` messages with response_to set to this cameraCommand.
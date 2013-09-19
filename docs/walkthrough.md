# First device walkthrough

This document will walk you through getting your first device setup and running with Nitrogen.

You can use your computer to do this walkthrough. We are going to walk through getting a simple keyboard switch device up and connected to Nitrogen before getting started with actual hardware.

## Preliminaries

1. [Install node.js](http://nodejs.org) for your platform (if you haven't already).
2. Clone the keyboard switch device project into your development directory on your machine:
`git clone http://github.com/nitrogenjs/switch switch`

Nitrogen automatically provisions devices with the security credentials they need to connect to the service on their first connection.  

We're going to use the Nitrogen cloud service instance at api.nitrogen.io by defaul in this walkthrough.  You can modify this in config.js if you'd rather use a local instance.

Let's start the device to do that.  Open a shell, change directory into the `switch` project and:
`node switch.js`

This should print out something that looks something like this:
`
warning: couldn't find current store, creating new one.
This principal (523b37c6d2f87e14040013e1) can be claimed using code: POFX-5039
switch is now off.
` 

The warning is expected. You didn't previously have a local store for this device so it created one for you. The Nitrogen client stores credential and principal information in its local store so that it has them for authenticating with a Nitrogen service.

It also printed a claim code for your device. Claim codes enable you to associate a device with your user account on a Nitrogen service so you can control it. Let's do that now.

Navigate to https://admin.nitrogen.io. You'll be asked to login to the service. Select 'Create Account' and enter your email, a password, and your full name and 'Create Account' again to create your account.

This will take you to the principals visible to your account. In Nitrogen, a principal is anything that authenticates and has a level of authorization with the service. This includes your user account, your devices, and even the service itself.

Nitrogen automatically attempts to match devices to users if there is only one user originating from the same IP address as the device. If it can't make this determination, you can use your claim code to match the device. Copy it from your shell and enter it into the 'Claim code for device' and claim the device.

The device should now appear in your list of principals. Click on it's id which will take you to its details page. Edit it's name to 'Keyboard Switch' and press save.

Focus the shell that you are running the device in and press any key. This will toggle the switch by sending a switchState message from the device to the service. If you flip back to the Nitrogen admin browser tab you had open for your switch principal you can see this because the message will have been displayed. Most of the Nitrogen admin application is real time so you can use it to watch what is happening with your devices and applications.

You've connected your first device. The switch example represents a pretty simple example of a device to relays its current state to the service.
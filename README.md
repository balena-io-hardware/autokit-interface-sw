![AutoKit Logo](./logo.png)

This is the software interface for the AutoKit suite, structured as a node library.

It does not include details about the hardware, or assembly. Please refer to the parent repo for links to all relevant documentation [here](https://github.com/balena-io-hardware/autokit).

## [Documentation](https://balena-io-hardware.github.io/autokit-interface-sw/)

The AutoKit software interface is designed to take into account that it is comprised of hardware modules which may be added to or substituted. This project aims to provide a simple and generalized interface despite potentially different hardware implementations.

Currently, the AutoKit software interface supports:

- Flashing of devices (either using SD card multiplexers or `usbboot`)
- Controlling power to the DUT
- Controlling the network connection of the DUT, via a Wi-FI hotspot or Ethernet connection sharing
- Capturing video output of the DUT
- Sending/receiving serial to/from the DUT

## Installation

```sh
npm install @balena/autokit
```

### Adding to the AutoKit software interface

The interface is divided into `features`, which are the pieces of functionality the kit can perform. Each `feature` can have multiple possible `implementations`, which represent potentially different hardware being used to achieve that functionality. 

An implementation can be added so the kit can support a new piece of hardware, but the class used to create that `implementation` must have the same interface as the rest of the `implementations` that implement that `feature`. 


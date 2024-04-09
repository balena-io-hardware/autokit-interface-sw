# Flashing

The autokit can be used to automated the flashing/provisioning of may linuxSBC device under test. 


## Types of device

Depending on the characteristics of the DUT, different 3 hardware configurations and software parameters must be set differently.

### Generic sd card boot devices

These are devices that just boot from an SD card, for example the raspberry pi 3 or 4.

When configuring the autokit to flash these types of devices, you can just use the `generic-sd-boot` type. e.g:

```js
await flash(filename, `generic-sd-boot`);
```

### Generic "flasher" devices

These are devices that boot from a flasher image over SD or USB stick, then flash internal storage - then `generic-flasher` can be used. 

When the DUT requires a USB stick instead of an SD card, the SD mux can be plugged into a generic uSD to USB adapter.

#### Boot switches

Some devices require a boot switch or jumper to be toggled to boot from SD/USB and then toggled again to boot from internal storage.

There are multiple possibilities here:

- use the `digitalRelay` [feature](../features/digitalRelay/) to toggle a jumper. Connect it to the jumper
- if there is not a jumper and instead its a switch - desolder it and solter in wires connected to the relay
- If you do that, use `generic-flasher-boot-switch`.
- if testing balenaOS - flash the internal storage of the device once manually. Then leave the switch in the internal storage position. Then connect it to the autokit. Future boots, the device will automatically boot from a flasher image on the SD card if present, or internal storage otherwise. This method requires no automated boot switch toggling, but may be weak for testing BSP updates

### USB-BOOT / raspberry pi compute module devices (CM3/CM4)

For raspberry pi compute module devices, the autokit can bring them up into mass storage mode then write the OS image.

The autokit must first put the board into the mass storage mode. Typically this is done with either a jumper on the board (e.g the raspberry pi compute module 4 IO board), or through the plugging/unplugging of a USB cable. 

- for the jumper method, use the  `digitalRelay`[feature](../features/digitalRelay/) to toggle a jumper. Keep a USB cable connected between the autokit and the DUT
- for the USB plug/unplug method, use a USB switch like this https://thepihut.com/products/usb-switch-and-multiplexer. Use the  `digitalRelay`[feature](../features/digitalRelay/) to toggle it. Connect a USB cable between the autokit and this switch, and the output of this switch to the DUT. 

For both cases, you can use the `generic-usb-boot` type. Don't connect an SD mux, and use `dummySdMux` for the sd-mux [feature](../features/sd-mux/)

### Jetson Orin devices

These are flashed using https://github.com/balena-os/jetson-flash

Right now there are specific types for each supported board on balena OS. 

### IOT gate imx8 devices

These are flashed using https://github.com/balena-os/iot-gate-imx8plus-flashtools

Right now there are specific types for each supported board on balena OS. 

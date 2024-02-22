# linuxNetwork

## Hardware 

- A wired and wireless network interface. This can be provided by USB adapters. 

## Dependencies
 
- network manager, accessible over DBUS

## Configuration

- `WIRED_IF`: the name of the wired ethernet interface on the autokit, that is connected to the DUT - with the intent of sharing the autokit ethernet over this interface
- `WIFI_IF`: the name of the wifi interface on the autokit that will be used to create a wifi access point
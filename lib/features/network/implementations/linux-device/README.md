# linuxNetwork

## Hardware 

- A wired and wireless network interface. This can be provided by USB adapters. 

## Dependencies
 
- network manager, accessible over DBUS

## Configuration

- `WIRED_IF`: the name of the wired ethernet interface on the autokit, that is connected to the DUT - with the intent of sharing the autokit ethernet over this interface
- `WIFI_IF`: the name of the wifi interface on the autokit that will be used to create a wifi access point
- `WIFI_AP_CHANNEL`: Some host devices don't like setting up an access point on channel > 11 - in this case, this variable can be used to speificy an integer value between 1 and 11, that the host will then use to set up the access point. If there are no issues, don't set this so networkManager automatically selects the best channel
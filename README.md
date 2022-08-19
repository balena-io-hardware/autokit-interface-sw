# autokit-sw

This is the software interface for the autokit suite. It is a container that runs a webserver that exposes autokit functionality.

This repository also  a node library that can be used to control the autokit from a node application.

## Architecture

The autokit software interface is designed to take into account that the autokit is a suite of hardware which may be added to or substituted. The autokit interface aims to provide a simple generalised interface despite potentially different hardware being used.

Currently, the autokit software interface supports:

- flashing 
- power on / off
- controlling the network connection of the DUT
- capturing video output of the DUT

### Adding to the autokit software interface

The interface is divided into `features`, which are the pieces of functionality the kit can perform. Each `feature` can have multiple possible `implementations`, which represent potentially different hardware being used to achieve that functionality. 

An implementation can be added so the kit can support a new piece of hardware, but the class used to create that `implementation` must have the same interface as the rest of the `implemenetations` that implement that `feature`. 


## How to use

Push this container onto an autokit host. This will start a webserver on port 80 of the container. 

### Power control

```sh
curl <IP>/power/on
```

Can be used to power the DUT on 

```sh
curl <IP>/power/off
```

Can be used to power off the DUT

### Network

The Autokit can share a wireless internet connection to the DUT using:

```sh
curl -X POST <IP>/network/createWireless
```

This will create an access point witht eh credentials: `ssid: autokit-wifi` and `psk: autokit-wifi-psk` by default. Credentials can be set by posting a json object instead:

```sh
curl -X POST localhost/flash -H "Content-Type: application/json" -d '{"ssid": "<SSID", "psk": "<PSK>"}'
```

A wired ethernet connection can be provided via:

```sh
curl -X POST <IP>/network/createWired
```

### Flashing

Flashing can be performed using:

```sh
curl -X POST localhost/flash -H "Content-Type: application/json" -d '{"filename": "<PATH_TO_IMAGE_ON_AUTOKIT>", "deviceType": "DEVCE_TYPE_SLUG_OF_DUT"}'
```

This requires the image to be on the autokit - this can be achieved through sending it to the autokit using rsync:

```sh
rsync -ar -vvv --whole-file --progress -e "ssh root@<IP_ADDRESS> -p 22222 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -q" <LOCAL_PATH_TO_FILE :<DESTINATION_ON_AUTOKIT>
```

### Capture

To start video capture from the DUT

```sh
curl -X POST <IP>/capture/start
```

This will comence capturing until a stop command is sent:

```sh
curl -X POST <IP>/capture/stop -o capture.tar.gz
```

Which will send a `.tar.gz` archive of all captured frames as jpeg images. 

### Serial

To open a serial connection to th DUT

```sh
curl -X POST <IP>/serial/open
```

To write a string to the DUT over serial

```sh
curl -X POST <IP>/serial/write -H 'Content-Type: application/json' -d '{"data": "<STRING_TO_WRITE_TO_DUT>"}'
```

To close the serial connection

```sh
curl -X POST <IP>/serial/close
```

This will return the response from the DUT, if any.

### Teardown

Posting to the teardown endpoint will tear down cleanly whatever has been setup on the kit - for example it will de activate any created network hotspots.
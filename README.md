# autokit-sw

This is the software interface for the Autokit suite. It is a container that runs a web server that exposes Autokit functionality.

This repository also  a node library that can be used to control the autokit from a node application, without needing the container. It does not include details about the hardware, or assembly. Please refer to the parent repo for links to all relevant documentation [here](https://github.com/balena-io-hardware/autokit)

## Architecture

The Autokit software interface is designed to take into account that the Autokit is a suite of hardware which may be added to or substituted. The Autokit interface aims to provide a simple generalized interface despite potentially different hardware being used.

Currently, the Autokit software interface supports:

- flashing (control over the DUT's SD card/flashing medium, or via usbboot)
- power on / off
- controlling the network connection of the DUT, via a wifi hotspot or ethernet connection sharing
- capturing video output of the DUT
- sending/recieving serial to/from the DUT

### Adding to the Autokit software interface

The interface is divided into `features`, which are the pieces of functionality the kit can perform. Each `feature` can have multiple possible `implementations`, which represent potentially different hardware being used to achieve that functionality. 

An implementation can be added so the kit can support a new piece of hardware, but the class used to create that `implementation` must have the same interface as the rest of the `implementations` that implement that `feature`. 

## How to use

Push this container onto an Autokit host. This will start a web server on port 80 of the container. 

If the host device is a balena device, this will mean that the server will be reachable at `https://<UUID>.balena-devices.com/`, assuming that the public URL of that device is enabled.

If you ssh into the host device, you can use `localhost` as the `<IP>` in the below instructions.

### Power control

```sh
curl -X POST <IP>/power/on
```

Can be used to power the DUT on 

```sh
curl -X POST <IP>/power/off
```

Can be used to power off the DUT

### Network

The Autokit can share a wireless internet connection to the DUT using:

```sh
curl -X POST <IP>/network/createWireless
```

This will create an access point with the credentials: `ssid: autokit-wifi` and `psk: autokit-wifi-psk` by default. Credentials can be set by posting a JSON object instead:

```sh
curl -X POST <IP>/network/createWireless -H "Content-Type: application/json" -d '{"ssid": "<SSID>", "psk": "<PSK>"}'
```

A wired ethernet connection can be provided via:

```sh
curl -X POST <IP>/network/createWired
```

### Flashing

Flashing can be performed using:

```sh
curl -X POST <IP>/flash -H "Content-Type: application/json" -d '{"filename": "<PATH_TO_IMAGE_ON_AUTOKIT>", "deviceType": "DEVICE_TYPE_SLUG_OF_DUT"}'
```

This requires the image to be on the autokit - this can be achieved through sending it over `rsync`.

Note that the image must be accessible from the autokit container. One way of achieving this is putting it into a volume. In the app demonstrated in this repo, there is a `core_storage` volume. You can find the path to this volume from the host via:

```sh
ssh <USERNAME>@ssh.balena-devices.com -p 22 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -q host <UUID> ls /var/lib/docker/volumes/ | grep core
```

and then using the output of that command with this:

```sh
rsync -ar -vvv --whole-file --progress -e "ssh <USERNAME>@ssh.balena-devices.com -p 22 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -q host <UUID>" <PATH_TO_IMAGE_LOCALLY>/ :/var/lib/docker/volumes/<OUTPUT_OF_PREVIOUS_COMMAND/_data

```
The above instructions assume your host device is a balena device connected to balena cloud.

### Capture

To start video capture from the DUT

```sh
curl -X POST <IP>/capture/start
```

This will commence capturing until a stop command is sent:

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


### Configuration
The autokit will use dummy implementations by default. You can select which implementations to use via the `/config` endpoint:

```sh
curl -X POST <IP>/config -H 'Content-Type: application/json' -d '{<CONFIG_OPTIONS>}'
```

For example:

```sh
curl -X POST localhost/config -H 'Content-Type: application/json' -d '{"serial": "ftdi", "power": "usbrelay"}'
```

Any config options supported will not be applied. The configuration is stored in a voluem in `/data/config.json`

To fetch the current config:

```sh
curl localhost/config
```
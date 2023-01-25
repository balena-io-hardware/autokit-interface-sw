# Issues

- terminology (implementation/feature) - renamed to functions/nodes
- Currently missing examples/tests
- autokit class - shouldn't restrict you to 1 of each node
 
  
    - need node detection
- remove "flashing" from the autokit class, and instead have it as a sperate utility in the npm package - it can then be imported in autokit-server/worker and leviathan and wherever else

- webserver -> block and rename it to autokit-block/server


We talked about it more == and thought that we should remove this core/accessory seperation
We can still have a mpaping of ports to nodes  - and can still use healthchecks/tests
********
core:
    A core function must have a node specified, and plugged in to the core set of usb ports

accessory:
    ** does not require a node specified, plugged in to accessory set of usb ports
**************

utility:
    composite functions that may be used together in a repeatable manner, such as flashing a device which requires power, sd mux, etc.

Example:
    If you want to add another relay - plug it into the accessory ports, create a new instance of the power function, specifiying which port its plugged in to


# USB addressing

- Cn for n core ports
- An for n accessory port

map.json for storing the mapping from logical port addresses to Linux ones, e.g. `C1 -> /sys/bus/usb/devices/3-1`

We can the use udev to detect device info `udevadm info /sys/bus/usb/devices/3-1`

Or we could use udev rules to create symlinks on the fly, if that's supported by balenaOS https://stackoverflow.com/questions/4800099/how-to-identify-multiple-usb-serial-adapters-under-ubuntu-10-1
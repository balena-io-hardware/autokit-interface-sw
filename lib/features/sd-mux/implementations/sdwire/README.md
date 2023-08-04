# SDWire SD card multiplexor

## Hardware
This implementation `sdWire` is a wrapper for this: https://shop.3mdeb.com/shop/open-source-hardware/sdwire/ the SDwire pcb.

## Dependencies
If using this implementation, the host must have the following setup:
```
apt-get install libpopt-dev libftdi1-dev (if alpine then apk add libftdi1-dev popt-dev)
git clone https://git.tizen.org/cgit/tools/testlab/sd-mux
mkdir sd-mux/build && cd sd-mux/build && cmake ../ && make
make install
```


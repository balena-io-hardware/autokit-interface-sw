# crelay

## Hardware
This implementation is to be used when a relay is being used that is controlled via the `crelay` tool: https://github.com/balena-io-hardware/crelay

## Dependencies
If using this implementation, the host must have the following setup:

```
apt-get install libftdi1 libftdi-dev libhidapi-libusb0 libhidapi-dev libusb-1.0-0 libusb-1.0-0-dev 
git clone https://github.com/balena-io-hardware/crelay.git
cd crelay/src 
make [DRV_CONRAD=n] [DRV_SAINSMART=n] [DRV_HIDAPI=n] 
make install
```

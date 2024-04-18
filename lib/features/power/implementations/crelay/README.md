# crelay

## Hardware
This implementation is to be used when a relay is being used that is controlled via the `crelay` tool: https://github.com/balena-io-hardware/crelay

## Dependencies

- alpine distribution 
- git

## Configuration

- `POWER_RELAY_SERIAL`: the serial of the relay. If not specified, the first detected device will be selected. This can cause issues if USB to serial FTDI adapters are also connected to the host, as they are controllable via `crelay` tools. 
- `POWER_RELAY_NUM`: for specifying which channel of the relay is being used for controlling the power to the DUT, in the case where multiple channels on the same relay are being used. Defaults to 1 if not specified
- `USB_RELAY_CONN`: `NC` or `NO` - for normally open or normally closed relay configuration. Default is `NO` and recommended
# crelay

## Hardware
This implementation is to be used when a relay is being used that is controlled via the `crelay` tool: https://github.com/balena-io-hardware/crelay

## Dependencies

- alpine distribution 
- git

## Configuration

- `CRELAY_POWER_CHANNEL`: the relay channel connected to the DUT power
- `USB_RELAY_CONN`: `NC` or `NO` - for normally open or normally closed relay configuration
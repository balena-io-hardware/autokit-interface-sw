# autokitRelay

## Hardware 

This is for these USB relays (example, they are everywhere): https://www.amazon.co.uk/Control-Intelligent-Channel-Controller-Support-default/dp/B07PWPF2DT/

They used a HID interface and are controllable via:

- https://github.com/darrylb123/usbrelay
- https://github.com/josephdadams/USBRelay

## Dependencies

## Configuration

- `POWER_RELAY_SERIAL`: the serial of the relay. An example of how to obtain that is here: https://github.com/darrylb123/usbrelay?tab=readme-ov-file#usage 
- `POWER_RELAY_NUM`: for specifying which channel of the relay is being used for the power control of the DUT in the case of multiple channels being on the relay. Default is `0` which leads to all channels being toggled - actual channel numbers start at `1`
- `USB_RELAY_CONN`: `NO` or `NC` - for selecting if the normally open or closed configuration is used - default is `NO` and recommended
- `GPIO_POWER_DET` : (Tx2 specific) - for selecting the PGIO pin to be used for power state detection
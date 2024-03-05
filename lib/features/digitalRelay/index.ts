import { DigitalUSBRelay } from "./implementations/usb-relay";
import { DummyDigitalRelay } from "./implementations/dummy-digital-relay";
import { PiGpio } from "./implementations/piGpio"

const digitalRelayImplementations: {[key: string]: Type<DigitalRelay> } = {
	usbRelay: DigitalUSBRelay,
	gpio: PiGpio,
	dummyPower: DummyDigitalRelay,
};

export { digitalRelayImplementations }
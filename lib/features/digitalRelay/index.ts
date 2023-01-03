import { DigitalUSBRelay } from "./implementations/usb-relay";
import { DummyDigitalRelay } from "./implementations/dummy-digital-relay";

const digitalRelayImplementations: {[key: string]: Type<DigitalRelay> } = {
	usbRelay: DigitalUSBRelay,
	dummyPower: DummyDigitalRelay,
};

export { digitalRelayImplementations }
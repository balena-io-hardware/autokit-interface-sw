import { DummySerial } from "./implementations/dummy-serial";
import { Ftdi } from "./implementations/ftdi";

const serialImplementations: {[key: string]: Type<Serial> } = {
	dummySerial: DummySerial,
	ftdi: Ftdi,
};

export { serialImplementations }
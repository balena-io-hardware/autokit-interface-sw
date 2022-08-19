import { Ftdi } from "./implementations/ftdi";

const serialImplementations: {[key: string]: typeof Ftdi } = {
	ftdi: Ftdi,
};

export { serialImplementations }
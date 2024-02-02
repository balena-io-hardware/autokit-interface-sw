import { DummyKeyboard } from "./implementations/dummy-keyboard";
import { Rpi0Keyboard } from "./implementations/rpi0-keyboard";

const keyboardImplementations: {[key: string]: Type<Keyboard> } = {
	dummyKeyboard: DummyKeyboard,
	rpi0Keyboard: Rpi0Keyboard,
};

export { keyboardImplementations }
import { AutokitRelay } from "./implementations/autokit-relay";
import { DummyPower } from "./implementations/dummy-power";

const powerImplementations: {[key: string]: Type<Power> } = {
	autokitRelay: AutokitRelay,
	dummyPower: DummyPower,
};

export { powerImplementations }
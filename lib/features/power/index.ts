import { AutokitRelay } from "./implementations/autokit-relay";
import { DummyPower } from "./implementations/dummy-power";
import { Crelay } from "./implementations/crelay";

const powerImplementations: {[key: string]: Type<Power> } = {
	autokitRelay: AutokitRelay,
	dummyPower: DummyPower,
	crelay: Crelay,
};

export { powerImplementations }
import { AutokitRelay } from "./node/autokit-relay";
import { DummyPower } from "./node/dummy-power";

const powerImplementations: {[key: string]: Type<Power> } = {
	autokitRelay: AutokitRelay,
	dummyPower: DummyPower,
};

export { powerImplementations }
import { AutokitRelay } from "./implementations/autokit-relay";
import { DummyPower } from "./implementations/dummy-power";
import { Crelay } from "./implementations/crelay";
import { JetsonTx2Power } from "./implementations/autokit-relay/jetson-tx2";

const powerImplementations: {[key: string]: Type<Power> } = {
	autokitRelay: AutokitRelay,
	dummyPower: DummyPower,
	crelay: Crelay,
	jetsonTx2: JetsonTx2Power
};

export { powerImplementations }
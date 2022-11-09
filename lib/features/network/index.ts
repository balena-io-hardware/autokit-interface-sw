import { DummyNetwork } from "./implementations/dummy-network";
import { LinuxNetwork } from "./implementations/linux-device";

const networkImplementations: {[key: string]: Type<Network> } = {
	dummyNetwork: DummyNetwork,
	linuxNetwork: LinuxNetwork,
};

export { networkImplementations }
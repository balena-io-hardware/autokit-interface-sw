import { DummyNetwork } from "./nodes/dummy-network";
import { LinuxNetwork } from "./nodes/linux-device";

const networkNodes: {[key: string]: Type<Network> } = {
	dummyNetwork: DummyNetwork,
	linuxNetwork: LinuxNetwork,
};

export { networkNodes }
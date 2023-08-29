import { AutoKitSdMux } from "./implementations/autokit-sd-mux";
import { LinuxAut } from "./implementations/linux-gmbh";
import { DummySdMux } from "./implementations/dummy-sd-mux";
import { SdWire } from "./implementations/sdwire";

const sdMuxImplementations: {[key: string]: Type<SdMux> } = {
	autokitSdMux: AutoKitSdMux,
	sdWire: SdWire,
	linuxAut: LinuxAut,
	dummySdMux: DummySdMux,
};

export { sdMuxImplementations }
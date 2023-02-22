import { AutoKitSdMux } from "./implementations/autokit-sd-mux";
import { LinuxAut } from "./implementations/linux-gmbh";
import { DummySdMux } from "./implementations/dummy-sd-mux";

const sdMuxImplementations: {[key: string]: Type<SdMux> } = {
	autokitSdMux: AutoKitSdMux,
	linuxAut: LinuxAut,
	dummySdMux: DummySdMux,
};

export { sdMuxImplementations }
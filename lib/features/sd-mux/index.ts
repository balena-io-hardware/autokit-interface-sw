import { AutoKitSdMux } from "./implementations/autokit-sd-mux";
import { TestbotSdMux } from "./implementations/testbot-sd-mux";
import { LinuxAut } from "./implementations/linux-gmbh";

const sdMuxImplementations: {[key: string]: typeof AutoKitSdMux } = {
	autokitSdMux: AutoKitSdMux,
	testbotSdMux: TestbotSdMux,
	linuxAut: LinuxAut
};

export { sdMuxImplementations }
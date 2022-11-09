import { DummyVideo } from "./implementations/dummy-video";
import { LinuxVideo } from "./implementations/linux-video";

const videoImplementations: {[key: string]: Type<Video> } = {
	linuxVideo: LinuxVideo,
	dummyVideo: DummyVideo,
};

export { videoImplementations }
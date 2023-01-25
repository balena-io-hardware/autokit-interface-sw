import { DummyVideo } from "./nodes/dummy-video";
import { LinuxVideo } from "./nodes/linux-video";

const videoNodes: {[key: string]: Type<Video> } = {
	linuxVideo: LinuxVideo,
	dummyVideo: DummyVideo,
};

export { videoNodes }
const debug = require("debug")("autokit:DummyVideo");

export class DummyVideo implements Video {
    public captureFolder = `/tmp/dummy`

    constructor(){
    }

    async setup(): Promise<void> {
		// find video device
        debug("Setting up");
    }

    async startCapture(): Promise<string> {
        debug("Starting capture");
        return this.captureFolder;
	}       
    

   
    async stopCapture(): Promise<void> {
        debug("Stopping capture");
    }

	async teardown(): Promise<void> {
		debug("Tearing down");
	}

}

const debug = require("debug")("autokit:DummySdMux");

export class DummySdMux implements SdMux {
    public DEV_SD = 'DUMMY'
    constructor() {

    }

    async setup(): Promise<void> {
        debug("Setting up");
    }

    async toggleMux(state: string): Promise<void> {
        debug("Toggling state to %o", state);
    }

    async teardown(): Promise<void> {
        debug("Tearing down");
    }
            
}

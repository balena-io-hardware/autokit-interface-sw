const debug = require("debug")("autokit:DummyPower");

export class DummyPower implements Power {
    private state = false;
    
    constructor(){
    }

    async setup(): Promise<void> {
        debug("Setting up");
    }

    // Power on the DUT
    async on(voltage?: number): Promise<void> {
        debug("Powering on DUA with voltage %o", voltage);
    }

    // Power off the DUT
    async off(): Promise<void> {
        debug("Powering off DUA");
    }

    async getState(): Promise<string> {
        // TODO return state of power on/off
        return this.state ? "on" : "off";
    }

    async teardown(): Promise<void> {
        debug("Tearing down");
        await this.off();
    }

}

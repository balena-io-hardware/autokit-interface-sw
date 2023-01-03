const debug = require("debug")("autokit:DummyDigitalRelay");

export class DummyDigitalRelay implements DigitalRelay {
    private state = false;
    
    constructor(){
    }

    async setup(): Promise<void> {
        debug("Setting up");
    }

    // Power on the DUT
    async on(): Promise<void> {
        debug("Toggling Digital Relay On");
    }

    // Power off the DUT
    async off(): Promise<void> {
        debug("Toggling Digital Relay Off");
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

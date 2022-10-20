// TODO - replace this with the autokit-realy npm package instead of using the command line tool

const USBRelay = require("@balena/usbrelay");

export class AutokitRelay implements Power {
    private relayId: string
    private relay: any
    constructor(){
        this.relayId = 'HW348_1'
        this.relay = new USBRelay(); //gets the first connected relay
    }

    async setup(): Promise<void> {
        // TODO: get relay ID
        // let { stdout, stderr } = await execAsync(`usbrelay`)
    }

    // Power on the DUT
    async on(voltage?: number): Promise<void> {
        console.log(`Powering on DUT...`)
        await this.relay.setState(0, true);
    }

    // Power off the DUT
    async off(): Promise<void> {
        console.log(`Powering off DUT...`)
        await this.relay.setState(0, false);
    }

    async getState(): Promise<string> {
        // TODO return state of power on/off
        return 'off'
    }

    async teardown(): Promise<void> {
        await this.off();
    }

}

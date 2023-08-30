const USBRelay = require("@balena/usbrelay");

export class DigitalUSBRelay implements DigitalRelay {
    private relayId: string
    private digitalRelay: any
    private conn: boolean
    constructor(){
        this.relayId = process.env.DIGITAL_RELAY_SERIAL || '959BI'
        let relays = USBRelay.Relays 
        console.log(relays)
        // iterate through the array, and find the relay that is associated with power
        // if there is only one relay, then it doesn't matter
        for(let relay of relays){
            if(relay.getSerialNumber() === this.relayId ){
                this.digitalRelay = new USBRelay(relay.devicePath);
            }
        }
        this.conn = (process.env.USB_RELAY_CONN === 'NC') ? false: true // if the user specifies they have set up the connection to be NC
    }

    async setup(): Promise<void> {
        console.log(`Relay ID ${this.relayId} is on HID path ${this.digitalRelay.devicePath}`)
    }

    // Power on the DUT
    async on(): Promise<void> {
        console.log(`Toggling digital relay on`)
        await this.digitalRelay.setState(0, this.conn);
    }

    // Power off the DUT
    async off(): Promise<void> {
        console.log(`Toggling digital relay off`)
        await this.digitalRelay.setState(0, !this.conn);
    }

    async getState(): Promise<string> {
        // TODO return state of power on/off
        return this.digitalRelay.getState();
    }

    async teardown(): Promise<void> {
        await this.off();
    }

}

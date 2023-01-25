// TODO - replace this with the autokit-realy npm package instead of using the command line tool

const USBRelay = require("@balena/usbrelay");

export class AutokitRelay implements Power {
    private relayId: string
    private powerRelay: any
    private conn: boolean
    constructor(){
        this.relayId = process.env.POWER_RELAY_SERIAL || 'HURTM'
        let relays = USBRelay.Relays 
        console.log(relays)
        //this.powerRelay = new USBRelay()
        // iterate through the array, and find the relay that is associated with power
        // if there is only one relay, then it doesn't matter
        if(relays.length === 1){
            this.powerRelay = new USBRelay(); //gets the first connected relay
        } else{
            for(let relay of relays){
                if(relay.getSerialNumber() === this.relayId ){
                    console.log(`Relay ID ${this.relayId} is on HID path ${relay.devicePath}`)
                    this.powerRelay = new USBRelay(relay.devicePath);
                }
            }
        }
        this.conn = (process.env.USB_RELAY_CONN === 'NC') ? false: true // if the user specifies they have set up the connection to be NC
    }

    async setup(): Promise<void> {
        console.log(`Relay ID ${this.relayId} is on HID path ${this.powerRelay.devicePath}`)
    }

    // Power on the DUT
    async on(voltage?: number): Promise<void> {
        console.log(`Powering on DUT...`)
        await this.powerRelay.setState(0, this.conn);
    }

    // Power off the DUT
    async off(): Promise<void> {
        console.log(`Powering off DUT...`)
        await this.powerRelay.setState(0, !this.conn);
    }

    async getState(): Promise<string> {
        // TODO return state of power on/off
        return this.powerRelay.getState();
    }

    async teardown(): Promise<void> {
        await this.off();
    }

}

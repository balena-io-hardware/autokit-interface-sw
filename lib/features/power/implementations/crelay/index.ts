import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class Crelay implements Power {
    private relaySerial
    private relayChannel: number
    private connOn: string
    private connOff: string

    constructor(){
        this.relaySerial = process.env.CRELAY_SERIAL || '';
        this.relayChannel = Number(process.env.CRELAY_POWER_CHANNEL) || 1; // indexing of relay channels starts at 1 for this device.
        this.connOn = (process.env.USB_RELAY_CONN === 'NC') ? 'OFF': 'ON' // if the user specifies they have set up the connection to be NC
        this.connOff = (process.env.USB_RELAY_CONN === 'NC') ? 'ON': 'OFF' // if the user specifies they have set up the connection to be NC
    }

    async setup(): Promise<void> {
        // install crelay tooling
        try {
            await execAsync('apk add make build-base');
            await execAsync('cd /usr/app/ && git clone https://github.com/balena-io-hardware/crelay.git');
            await execAsync('cd /usr/app/crelay/src && make && make install');
            await execAsync('cp /usr/app/crelay/src/crelay /usr/local/bin/crelay');

            // this retrieves info about the relay being used, and its serial
            let info = await execAsync(`crelay -i`);
            console.log(`Crelay controlled relay being used for power, serial: ${this.relaySerial}, channel: ${this.relayChannel}.`);
            console.log(info.stdout);
        } catch(e){
            console.log(e)
            console.log('Failed to initialise crelay tooling!')
        }
    }

    // Power on the DUT
    async on(voltage?: number): Promise<void> {
        console.log(`Powering on DUT...`);
        if(this.relaySerial) {
            await execAsync(`crelay -s ${this.relaySerial} ${this.relayChannel} ${this.connOn}`);
        } else {
            await execAsync(`crelay ${this.relayChannel} ${this.connOn}`);
        }

    }

    // Power off the DUT
    async off(): Promise<void> {
        console.log(`Powering off DUT...`);
        if(this.relaySerial) {
            await execAsync(`crelay -s ${this.relaySerial} ${this.relayChannel} ${this.connOff}`);
        } else {
            await execAsync(`crelay ${this.relayChannel} ${this.connOff}`);
        }

    }

    async getState(): Promise<string> {
        // TODO return state of power on/off
        if(this.relaySerial) {
            let state = await execAsync(`crelay -s ${this.relaySerial} ${this.relayChannel}`);
            return state.stdout;
        }

        // No serial.
        let state = await execAsync(`crelay ${this.relayChannel}`);
        return state.stdout;
    }

    async teardown(): Promise<void> {
        await this.off();
    }

}

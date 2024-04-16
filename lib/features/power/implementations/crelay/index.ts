import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class Crelay implements Power {
    private relayId: number
    private connOn: string
    private connOff: string

    constructor(){
        this.relayId = Number(process.env.CRELAY_POWER_CHANNEL) || 1; // indexing of relay channels starts at 1 for this device.
        this.connOn = (process.env.USB_RELAY_CONN === 'NC') ? 'OFF': 'ON' // if the user specifies they have set up the connection to be NC
        this.connOff = (process.env.USB_RELAY_CONN === 'NC') ? 'ON': 'OFF' // if the user specifies they have set up the connection to be NC
    }

    async setup(): Promise<void> {
        // install craly tooling
        try {
            await execAsync('apk add make build-base');
            await execAsync('cd /usr/app/ && git clone https://github.com/balena-io-hardware/crelay.git');
            await execAsync('cd /usr/app/crelay/src && make && make install');
            await execAsync('cp /usr/app/crelay/src/crelay /usr/local/bin/crelay');

            // this retrieves info about the relay being used, and its serial
            let info = await execAsync(`crelay -i ${this.relayId}`);
            console.log(`Crelay controlled relay being used for power, channel: ${this.relayId}.`);
            console.log(info.stdout);
        } catch(e){
            console.log(e)
            console.log('Failed to initialise crelay tooling!')
        }
    }

    // Power on the DUT
    async on(voltage?: number): Promise<void> {
        console.log(`Powering on DUT...`);
        await execAsync(`crelay ${this.relayId} ${this.connOn}`);
    }

    // Power off the DUT
    async off(): Promise<void> {
        console.log(`Powering off DUT...`);
        await execAsync(`crelay ${this.relayId} ${this.connOff}`);
    }

    async getState(): Promise<string> {
        // TODO return state of power on/off
        let state = await execAsync(`crelay ${this.relayId}`);
        return state.stdout;
    }

    async teardown(): Promise<void> {
        await this.off();
    }

}

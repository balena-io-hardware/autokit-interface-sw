import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class Crelay implements Power {
    private relayChannel: number
    private connOn: string
    private connOff: string
    private relaySerial: string
    private crelayCmd: string

    constructor(){
        // this implmentation uses the crelay too in interactive mode # https://github.com/ondrej1024/crelay?tab=readme-ov-file#command-line-interface
        // commands take the following forms:
        // crelay [-s <serial number>] -i | [<relay number>] [ON|OFF]

        this.relayChannel = Number(process.env.POWER_RELAY_NUM) || 1; // indexing of relay channels starts at 1 for this device.
        this.connOn = (process.env.USB_RELAY_CONN === 'NC') ? 'OFF': 'ON' // if the user specifies they have set up the connection to be NC
        this.connOff = (process.env.USB_RELAY_CONN === 'NC') ? 'ON': 'OFF' // if the user specifies they have set up the connection to be NC
        this.relaySerial = (process.env.POWER_RELAY_SERIAL) ? `-s ${process.env.POWER_RELAY_SERIAL} `: ''; // if not specified, then the check will evaluate to false - and give an empty string
        this.crelayCmd = `crelay ${this.relaySerial}${this.relayChannel}`;
    }

    async setup(): Promise<void> {
        // install craly tooling
        try {
            await execAsync('apk add make build-base');
            await execAsync('cd /usr/app/ && git clone https://github.com/balena-io-hardware/crelay.git');
            await execAsync('cd /usr/app/crelay/src && make && make install');
            await execAsync('cp /usr/app/crelay/src/crelay /usr/local/bin/crelay');

            // this retrieves info about the relay being used, and its serial
            console.log(`Using crelay command prefix: ${this.crelayCmd}`)

            let info = await execAsync(`crelay -i`);
            console.log(info.stdout);
        } catch(e){
            console.log(e)
            console.log('Failed to initialise crelay tooling!')
        }
    }

    // Power on the DUT
    async on(voltage?: number): Promise<void> {
        console.log(`Powering on DUT...`);
        await execAsync(`${this.crelayCmd} ${this.connOn}`);
    }

    // Power off the DUT
    async off(): Promise<void> {
        console.log(`Powering off DUT...`);
        await execAsync(`${this.crelayCmd} ${this.connOff}`);
    }

    async getState(): Promise<string> {
        let state = await execAsync(`${this.crelayCmd}`);
        return state.stdout;
    }

    async teardown(): Promise<void> {
        await this.off();
    }

}

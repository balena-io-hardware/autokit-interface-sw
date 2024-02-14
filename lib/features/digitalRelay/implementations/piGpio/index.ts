import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class PiGpio implements DigitalRelay {
    private pin: string
    
    constructor(){
        this.pin = process.env.GPIO_PIN || '26'
    }

    async setup(): Promise<void> {
        try{
            console.log(`Setting up GPIO pin ${this.pin}...`)
            await execAsync(`echo ${this.pin} > /sys/class/gpio/export || true`);
            await execAsync(`echo out > /sys/class/gpio/gpio${this.pin}/direction`);
        } catch(e){
            console.log(`Error during setup..`)
            console.log(e)
        }
    }

    // Power on the DUT
    async on(): Promise<void> {
        console.log(`Toggling gpio pin ${this.pin} on`)
        await execAsync(`echo 1 > /sys/class/gpio/gpio${this.pin}/value`);
    }

    // Power off the DUT
    async off(): Promise<void> {
        console.log(`Toggling gpio pin ${this.pin} off`)
        await execAsync(`echo 0 > /sys/class/gpio/gpio${this.pin}/value`);
    }

    async getState(): Promise<string> {
        // TODO return state of power on/off
        let res = await execAsync(`cat /sys/class/gpio/gpio${this.pin}/value`);
        return res.stdout
    }

    async teardown(): Promise<void> {
        await this.off();
    }

}

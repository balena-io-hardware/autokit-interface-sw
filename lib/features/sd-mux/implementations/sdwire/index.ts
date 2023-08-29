import { exec } from 'child_process';
import { promisify } from 'util';
import { delay } from 'bluebird';

const execAsync = promisify(exec);

export class SdWire implements SdMux {
    public DEV_SD = 'usb-Generic_Ultra_HS-SD_MMC_000000264001-0:0'
    constructor(){
    }

    async setup(): Promise<void> {
        // set to host
        await execAsync('sd-mux-ctrl --ts -v 0');
        let sdCheck = await execAsync(`ls /dev/disk/by-id/usb-Generic_Ultra_HS-SD_MMC_* | head -1`);
        this.DEV_SD = sdCheck.stdout.trim();
        console.log(`SD MUX is: ${this.DEV_SD}`);
    }

    async toggleMux(state: string): Promise<void> {
        if(state === 'host'){
            console.log('Switching SD card to host');
            await execAsync('sd-mux-ctrl --ts -v 0');
            // it can take some time before the mux is toggled - so just to be sure, we can add some delay here
            await delay(5000);
        } else if(state === 'dut'){
            console.log('Switching SD card to DUT');
            await execAsync('sd-mux-ctrl --dut -v 0');
            // it can take some time before the mux is toggled - so just to be sure, we can add some delay here
            await delay(5000);
        }
    }

    async teardown(): Promise<void> {
        
    }
            
}

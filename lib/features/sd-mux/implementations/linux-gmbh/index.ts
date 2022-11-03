import { exec } from 'child_process';
import { promisify } from 'util';
import { delay } from 'bluebird';

const execAsync = promisify(exec);

export class LinuxAut implements SdMux {
    public DEV_SD = '/dev/disk/by-id/usb-LinuxAut_sdmux_HS-SD_MMC_000000000628-0:0'
    constructor(){
    }

    async setup(): Promise<void> {
        await execAsync('usbsdmux /dev/sg* host');
        let sdCheck = await execAsync(`ls /dev/disk/by-id/usb-LinuxAut_sdmux_HS-SD_MMC_* | head -1`);
        this.DEV_SD = sdCheck.stdout;
        console.log(`SD MUX is: ${this.DEV_SD}`);
    }

    async toggleMux(state: string): Promise<void> {
        if(state === 'host'){
            console.log('Switching SD card to host');
            await execAsync('usbsdmux /dev/sg* host');
            await delay(2000);
        } else if(state === 'dut'){
            console.log('Switching SD card to DUT');
            await execAsync('usbsdmux /dev/sg* dut');
            await delay(2000);
        }
    }

    async teardown(): Promise<void> {
        
    }
            
}

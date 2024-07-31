import { exec } from 'child_process';
import { promisify } from 'util';
import { delay } from 'bluebird';

const execAsync = promisify(exec);

export class LinuxAut implements SdMux {
    public DEV_SD = '/dev/disk/by-id/usb-LinuxAut_sdmux_HS-SD_MMC_000000000628-0:0';
    private sgDev = 'sg*';
    constructor(){
    }

    async setup(): Promise<void> {
        // determine the /dev/sg* device number for the mux
        let devList = await execAsync(`ls /sys/class/scsi_generic/`);
        for (let device of devList.stdout.split("\n")){
            let vendor = await execAsync(`cat /sys/class/scsi_generic/${device}/device/vendor`);
            if(vendor.stdout.trim() === 'LinuxAut'){
                this.sgDev = device.trim();
                console.log(`SD mux is at /dev/${this.sgDev}!`);
                break;
            }
        }

        await execAsync(`usbsdmux /dev/${this.sgDev} host`);
        let sdCheck = await execAsync(`ls /dev/disk/by-id/usb-LinuxAut* | head -1`);
        this.DEV_SD = sdCheck.stdout.trim();
        console.log(`SD MUX is: ${this.DEV_SD}`);
    }

    async toggleMux(state: string): Promise<void> {
        if(state === 'host'){
            console.log('Switching SD card to host');
            await execAsync(`usbsdmux /dev/${this.sgDev} host`);
            // it can take some time before the mux is toggled - so just to be sure, we can add some delay here
            await delay(5000);
        } else if(state === 'dut'){
            console.log('Switching SD card to DUT');
            await execAsync(`usbsdmux /dev/${this.sgDev} dut`);
            // it can take some time before the mux is toggled - so just to be sure, we can add some delay here
            await delay(5000);
        }
    }

    async teardown(): Promise<void> {
        
    }
            
}

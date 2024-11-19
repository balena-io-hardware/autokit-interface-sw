import { delay } from 'bluebird';
import { AutokitRelay } from "./";
import { exec } from 'mz/child_process';

// Device specific override for Tx2 power on / off sequencing
// Assumes this USB relay is connected to J6, NO
export class JetsonTx2Power extends AutokitRelay {
    // Only way of determining Tx2 power state is checking the ethernet carrier state
    public wiredIface: string;

    constructor(){
        super();
        this.wiredIface = process.env.WIRED_IF || 'eth1';
    }

    async checkDutPower() {
        const [stdout, _stderr] = await exec(`cat /sys/class/net/${this.wiredIface}/carrier`);
        const file = stdout.toString();
        if (file.includes('1')) {
            console.log(`DUT is currently On`);
            return true;
        } else {
            console.log(`DUT is currently Off`);
            return false;
        }
    }

    // Power on the DUT
    async on(): Promise<void> {
        // Trigger power on via a short button press - by toggling on, waiting, then toggling off
        console.log(`Triggering TX2 power on sequence...`);
        await delay(1000);
        await super.on();
        await delay(3000);
        await super.off();
        await delay(3000);
        console.log(`Triggered power on sequence on TX2!`); 
    }

    // Power off the DUT
    async off(): Promise<void> {
         // Trigger power off via a short button press - by toggling on, waiting, then toggling off
         // If the DUT is already off, this will actually power the board back on - leading to potentially strange states during the provisioning
         console.log(`powerOff - Will turn off TX2`);
         const dutIsOn = await this.checkDutPower();
         if (dutIsOn) {
            console.log('TX2 is booted, trigger normal shutdown');
            // Simulate short press on the power button
            await delay(1000);
            await super.on();
            await delay(10 * 1000);
            await super.off()

            console.log(`Triggered power off sequence on TX2`);
            await delay(1000);

            /* Ensure device is off */
            const dutIsOn = await this.checkDutPower();
            if (dutIsOn) {
                console.log('WARN: Triggered force shutdown but TX2 did not power off');
            }
        } else {
            console.log('TX2 is not booted, no power toggle needed');
        }
    }
}

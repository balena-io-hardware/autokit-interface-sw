import { Autokit } from '../../';
import { exec } from 'mz/child_process';
import { delay } from 'bluebird';


const TIMEOUT_COUNT = Number(process.env.POWER_OFF_TIMEOUT) || 30

/**
 * Checks whether the DUT is powered using Ethernet carrier detection
 **/
async function checkDutPower(autoKit:Autokit) {
    const [stdout, _stderr] = await exec(`cat /sys/class/net/${autoKit.network.wiredIface}/carrier`);
    const file = stdout.toString();
    if (file.includes('1')) {
        console.log(`DUT is currently On`);
        return true;
    } else {
        console.log(`DUT is currently Off`);
        return false;
    }
}

export async function waitForPowerOffEthernet(autoKit:Autokit):Promise<void>{
    // dut will now internally flash - need to wait until we detect DUT has powered off
    // FOR NOW: use the network
    // check if the DUT is on first
    let dutOn = false;
    while (!dutOn) {
        console.log(`waiting for DUT to be on`);
        dutOn = await checkDutPower(autoKit);
        await delay(1000 * 5); // 5 seconds between checks
    }

    const POLL_INTERVAL = 1000; // 1 second
    const POLL_TRIES = 20; // 20 tries
    let attempt = 0;
    await delay(1000 * 60);
    while (dutOn) {
        await delay(1000 * 10); // 10 seconds between checks
        console.log(`waiting for DUT to be off`);
        dutOn = await checkDutPower(autoKit);
        // occasionally the DUT might appear to be powered down, but it isn't - we want to confirm that the DUT has stayed off for an interval of time
        if (!dutOn) {
            let offCount = 0;
            console.log(`detected DUT has powered off - confirming...`);
            for (let tries = 0; tries < POLL_TRIES; tries++) {
                await delay(POLL_INTERVAL);
                dutOn = await checkDutPower(autoKit);
                if (!dutOn) {
                    offCount += 1;
                }
            }
            console.log(
                `DUT stayed off for ${offCount} checks, expected: ${POLL_TRIES}`,
            );
            if (offCount !== POLL_TRIES) {
                // if the DUT didn't stay off, then we must try the loop again
                dutOn = true;
            }
        }
        attempt += 1;
        if (attempt === TIMEOUT_COUNT){
            await autoKit.power.off();
            throw new Error(`Timed out while trying to flash internal storage!!. Powered off DUT.`)
        }
    }
}
import { exec } from 'mz/child_process';
import { delay } from 'bluebird';
import * as Bluebird from 'bluebird';
import * as retry from 'bluebird-retry';
import * as sdk from 'etcher-sdk';
import { fs } from 'mz';
import { BlockDeviceAdapter } from 'etcher-sdk/build/scanner/adapters';
import { Autokit } from '../';

/**
 * Flash an image to a disk - this is the low level function used to flash a disk (SD card, USD storage device etc)
 **/
async function flashToDisk(
    dst: sdk.sourceDestination.BlockDevice,
    src: string,
) {
    const sdkSource: sdk.sourceDestination.SourceDestination = new sdk.sourceDestination.File(
        {
            path: src,
        },
    );
    const innerSource = await sdkSource.getInnerSource();
    const result = await sdk.multiWrite.pipeSourceToDestinations({
        source: innerSource,
        destinations: [dst],
        onFail: (_: any, error: Error) =>
            console.log(`Failure during flashing: ${error}`),
        onProgress: (_progress: sdk.multiWrite.MultiDestinationProgress) => {
        },
        verify: true,
    });
    if (result.failures.size > 0) {
        const errorsMessage = new Array(...result.failures.values())
            .map((e) => e.message)
            .join('\n');
        throw new Error(
            `Flashing failed with the following errors: ${errorsMessage}`,
        );
    }
}


function getDevInterface(
    devPath: string | undefined,
    timeout: retry.Options = { max_tries: 5, interval: 5000 },
): Bluebird<string> {

    if(devPath === undefined){
        throw new Error(`No device defined!`)
    }

    return retry(
        () => {
            return fs.realpath(devPath);
        },
        { ...timeout, throw_original: true },
    );

}

/**
 * Gets the etcher-sdk compatible BlockDevice from a path
 **/
async function getDrive(
	device: string,
): Promise<sdk.sourceDestination.BlockDevice> {
	// Do not include system drives in our search
	const adapter = new BlockDeviceAdapter({
		includeSystemDrives: () => false,
		unmountOnSuccess: false,
		write: true,
		direct: true,
	});
	const scanner = new sdk.scanner.Scanner([adapter]);

	await scanner.start();

	let drive;

	try {
		drive = scanner.getBy('device', device);
	} finally {
		scanner.stop();
	}
	if (!(drive instanceof sdk.sourceDestination.BlockDevice)) {
		throw new Error(`Cannot find ${device}`);
	}

	return drive;
}

/**
 * Toggles uhubctl-compatible USB port power state
 **/
async function toggleUsb(state: boolean, port: string) {
    console.log(`Toggling USB ${state ? 'on' : 'off'}`);
    await exec(
        `uhubctl -r 1000 -a ${state ? 'on' : 'off'} -p ${port} -l 1-1`,
    ).catch(() => {
        console.log(`Failed. Check that uhubctl is available.`);
    });
}

/**
 * Flash an image to a disk - this is the low level function used to flash a disk (SD card, USD storage device etc)
 **/
async function flashSD(filename: string, autoKit: Autokit){
    console.log(`Entering flash method for SD card boot devices...`);
    await autoKit.power.off();
    await delay(1000 * 5)
    await autoKit.sdMux.toggleMux('host');

    // For linux, udev will provide us with a nice id.
    const drive = await getDrive(await getDevInterface(autoKit.sdMux.DEV_SD));

    console.log(`Start flashing the image`);
    await flashToDisk(drive, filename);
    console.log('Flashing completed');
    await autoKit.sdMux.toggleMux('dut');
    
}

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

async function flashFlasher(filename: string, autoKit: Autokit, jumper: boolean){
    // first flash sd
    console.log(`Entering flash method for flasher images...`);
    await flashSD(filename, autoKit);

    // toggle to sd boot if applicable
    if(jumper){
        await autoKit.digitalRelay.on()
    }

    //small delay to ensure sd and jumper has toggled
    await delay(1000 * 10);
    await autoKit.power.on();

    // dut will now internally flash - need to wait until we detect DUT has powered off
    // can be done through ethernet carrier signal, or through current measurement (or something else...)
    // FOR NOW: use the network
    // check if the DUT is on first
    let dutOn = false;
    while (!dutOn) {
        console.log(`waiting for DUT to be on`);
        dutOn = await checkDutPower(autoKit);
        await delay(1000 * 5); // 5 seconds between checks
    }
    // once we confirmed the DUT is on, we wait for it to power down again, which signals the flashing has finished
    // wait initially for 60s and then every 10s before checking if the board performed a shutdown after flashing the internal storage
    const POLL_INTERVAL = 1000; // 1 second
    const POLL_TRIES = 20; // 20 tries
    const TIMEOUT_COUNT = 30;
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
                `DUT stayted off for ${offCount} checks, expected: ${POLL_TRIES}`,
            );
            if (offCount !== POLL_TRIES) {
                // if the DUT didn't stay off, then we must try the loop again
                dutOn = true;
            }
        }
        attempt += 1;
        if (attempt === TIMEOUT_COUNT){
            throw new Error(`Timed out while trying to flash internal storage!!`)
        }
    }
    console.log('Internally flashed - powering off DUT');
    // power off and toggle mux.
    await delay(1000*10);
    await autoKit.power.off();
    await autoKit.sdMux.toggleMux('host');
    
    // if jumper is present, toggle out of sd boot mode
    if(jumper){
        await delay(1000*10)
        await autoKit.digitalRelay.off()
    }

    // add a slight delay here to avoid powering off and on too quickly
    await delay(1000*60)
}

async function flashUsbBoot(filename: string, autoKit: Autokit, port: string, power: boolean, jumper: boolean){
    console.log(`Entering flash method for USB-Boot devices...`);

    await autoKit.power.off();
    // if applicable, switch jumper to msd mode
    if(jumper){
        await autoKit.digitalRelay.on()
    } else {
        // power on the USB - but ensure it is powered off first - this way we ensure we get the device in a fresh state
        await toggleUsb(false, port);
        await delay(5*1000);
        await toggleUsb(true, port);
    }       

    if(power){
        await delay(5*1000);
        await autoKit.power.on();
    }

    // etcher-sdk (power on) usboot
    const adapters: sdk.scanner.adapters.Adapter[] = [
        new BlockDeviceAdapter({
            includeSystemDrives: () => false,
            unmountOnSuccess: false,
            write: true,
            direct: true,
        }),
        new sdk.scanner.adapters.UsbbootDeviceAdapter(),
    ];
    const deviceScanner = new sdk.scanner.Scanner(adapters);
    console.log('Waiting for compute module');
    // Wait for compute module to appear over usb
    const computeModule: sdk.sourceDestination.UsbbootDrive = await new Promise(
        (resolve, reject) => {
            function onAttach(
                drive: sdk.scanner.adapters.AdapterSourceDestination,
            ) {
                if (drive instanceof sdk.sourceDestination.UsbbootDrive) {
                    deviceScanner.removeListener('attach', onAttach);
                    resolve(drive);
                }
            }
            deviceScanner.on('attach', onAttach);
            deviceScanner.on('error', reject);
            deviceScanner.start();
        },
    );
    console.log('Compute module attached');
    // wait to convert to block device.
    await new Promise<void>((resolve, reject) => {
        function onDetach(
            drive: sdk.scanner.adapters.AdapterSourceDestination,
        ) {
            if (drive === computeModule) {
                deviceScanner.removeListener('detach', onDetach);
                resolve();
            }
        }
        deviceScanner.on('detach', onDetach);
        deviceScanner.on('error', reject);
    });

    // start a timeout - if the fin takes too long to appear as a block device, we must retry from the beginning

    console.log('Waiting for compute module to reattach as a block device');

    // let reAttachFail = false;
    const dest = await new Promise(
        (
            resolve: (drive: sdk.sourceDestination.BlockDevice) => void,
            reject,
        ) => {
            const timeout = setTimeout(() => {
                clearTimeout(timeout);
                console.log(`Timed out!`);
                reject();
            }, 1000 * 60 * 5);

            function onAttach(
                drive: sdk.scanner.adapters.AdapterSourceDestination,
            ) {
                if (
                    drive instanceof sdk.sourceDestination.BlockDevice &&
                    drive.description === 'Compute Module'
                ) {
                    console.log('Attached compute module.');
                    clearTimeout(timeout);
                    resolve(drive);
                    deviceScanner.removeListener('attach', onAttach);
                }
            }
            deviceScanner.on('attach', onAttach);
            deviceScanner.on('error', reject);
        },
    ).catch(() => {
        console.log(`Caught promise reject`);
        // reAttachFail = true
    });
    deviceScanner.stop();

    if (dest instanceof Object) {
        await delay(1000); // Wait 1s before trying to flash
        console.log('Flashing started...');
        await flashToDisk(dest, filename);
        console.log('Flashed!');
    }
    // put the DUT in entirely powered off state
    await autoKit.power.off();

    // if applicable, turn off msd mode
    if(jumper){
        await autoKit.digitalRelay.off()
    } else {
        await toggleUsb(false, port);
        await toggleUsb(false, port);
    }
    await delay(10*1000);
}
   
/**
 * 
 * Flash a given device type, automatically selecting the corresponding flashing method
 */
async function flash(filename: string, deviceType: string, autoKit: Autokit, port?: string){
    const flashProcedure = await import(`${__dirname}/devices/${deviceType}.json`);
    console.log(flashProcedure)
    switch(flashProcedure.type){
        case 'sd': {
            await flashSD(filename, autoKit);
            break;
        }
        case 'usbboot': {
            if(port === undefined){
                throw new Error('No usb port specified!')
            }
            await flashUsbBoot(filename, autoKit, port, flashProcedure.power, flashProcedure.jumper);
            break;
        }
        case 'flasher': {
            await flashFlasher(filename, autoKit, flashProcedure.jumper);
            break;
        }
    }
}

export { flash }
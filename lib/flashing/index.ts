import { exec, spawn } from 'mz/child_process';
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
async function toggleUsb(state: boolean, port: usbPort) {
    console.log(`Toggling USB ${state ? 'on' : 'off'}`);
    let loc = ''
    if(port.location !== undefined){
        loc = `-l ${port.location}`
    }
    console.log(`trying:  uhubctl -r 1000 -a ${state ? 'on' : 'off'} -p ${port.port} ${loc}`)
    await exec(
        `uhubctl -r 1000 -a ${state ? 'on' : 'off'} -p ${port.port} ${loc}`,
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
    // this delay is how long to wait after internal flashing before trying to re power the board. For the case where devices have capacitors that
    // take time to drain
    const powerOnDelay = Number(process.env.CAP_DELAY) || 1000*60;

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
    await delay(powerOnDelay)
}

async function flashUsbBoot(filename: string, autoKit: Autokit, port: usbPort, power: boolean, jumper: boolean){
     // this delay is how long to wait after internal flashing before trying to re power the board. For the case where devices have capacitors that
    // take time to drain
    const powerOnDelay = Number(process.env.CAP_DELAY) || 1000*60;
    
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
    await delay(powerOnDelay);
}
   
// this assumes a docker daemon is running on the same host
// utilises containerised jetson-flash tool: https://github.com/balena-os/jetson-flash
async function flashJetson(filename: string, autoKit: Autokit, deviceType: string, nvme: boolean){
    // Select the directory to build the container from, and the command to run inside the container once its built and running
    const JETSON_FLASH_DIR = process.env.JETSON_FLASH_DIR || '/usr/app/jetson-flash/Orin_Nx_Nano_NVME';
    const JETSON_FLASH_SCRIPT = process.env.JETSON_FLASH_SCRIPT || 'flash_orin.sh';
    const JETSON_FLASH_BRANCH = process.env.JETSON_FLASH_BRANCH || 'master';
    // now start the jetson flash tool with docker. 
    // build first

    try{ 
        await exec('cd /usr/app/ && git clone https://github.com/balena-os/jetson-flash.git');
    } catch(e){
        console.log(e)
    }

    // ensure we have latest jetson-flash
    let checkout = await exec(`cd /usr/app/jetson-flash && git fetch && git reset --hard origin/${JETSON_FLASH_BRANCH}`);
    console.log(checkout)
    
    // put device into recovery mode, this varies depending on the device.
    await autoKit.power.off();
    await delay(5 * 1000);
    // short pins to enter recovery mode
    await autoKit.digitalRelay.on();
    await delay(5 * 1000);

    // if the device is one of the NVME device types, we need to flash a USB key with the flasher image
    // https://github.com/balena-os/jetson-flash#orin-nx-flashing-steps
    
    if(nvme){
        await flashSD(filename, autoKit);
    }
    
    //power device on again 
    await autoKit.power.on();

    const powerOnDelay = Number(process.env.CAP_DELAY) || 1000*60*5;

    if(nvme){
        await new Promise<void>(async (resolve, reject) => {
            let build = spawn('docker',
                [
                    'build',
                    '-t',
                    'jf-image',
                    `${JETSON_FLASH_DIR}`
                ], 
                { 
                    'stdio': 'inherit'
                }
            )

            build.on('exit', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject()
                }
            });
            build.on('error', (err) => {
                reject(err);
            });
        });
    } else {
        await new Promise<void>(async (resolve, reject) => {
            let buildAndRun = spawn(`./build.sh`,
                [
                   `-m`,
                   `${deviceType}`
                ], 
                { 
                    'stdio': 'inherit',
                    'shell': true,
                    'cwd': JETSON_FLASH_DIR
                }
            )

            buildAndRun.on('exit', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject()
                }
            });
            buildAndRun.on('error', (err) => {
                reject(err);
            });
        });
    }

    // run flash container
    console.log(`File path: ${filename}`)
    // Then run container
    await new Promise<void>(async (resolve, reject) => {
        let flash = spawn('docker',
            [
                'container',
                'run',
                '--rm',
                '-it',
                '--privileged',
                '-v',
                '/dev/bus/usb:/dev/bus/usb',
                '-v',
                '/data:/data/',
                '-v',
                '/dev:/dev',
                'jf-image',
                `./${JETSON_FLASH_SCRIPT} -f ${filename} -m ${deviceType} --accept-license yes`
            ], 
            { 
                'stdio': 'inherit',
                'shell': true,
            }
        )

        flash.on('exit', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject()
            }
        });
        flash.on('error', (err) => {
            reject(err);
        });
    });


    if(nvme){
        // wait for jetson to power off
        const POLL_INTERVAL = 1000; // 1 second
        const POLL_TRIES = 20; // 20 tries
        const TIMEOUT_COUNT = 30000;
        let attempt = 0;
        let dutOn = true;
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
    }

    await autoKit.power.off();
    await delay(powerOnDelay);
    // unshort pins to exit recovery mode
    await autoKit.digitalRelay.off();
    await delay(5 * 1000);
    
    if(nvme){
        await autoKit.sdMux.toggleMux('host');
    }
   
}

async function flashIotGate(filename: string, autoKit: Autokit, port: usbPort, dram: string){
    const powerOnDelay = Number(process.env.CAP_DELAY) || 1000*60*5;

    // ensure we have latest flasher tool
    const IOT_GATE_FLASH_BRANCH = process.env.IOT_GATE_FLASH_BRANCH || 'master';
    try{ 
        await exec('cd /usr/app/ && git clone https://github.com/balena-os/iot-gate-imx8plus-flashtools.git');
    } catch(e){
        console.log(e)
    }
    let checkout = await exec(`cd /usr/app/iot-gate-imx8plus-flashtools && git fetch && git reset --hard origin/${IOT_GATE_FLASH_BRANCH}`);

    // Ensure DUT is powered off
    await autoKit.power.off();
    await delay(5 * 1000);

    // VCC of the programming USB cable is connected to NO relay
    // toggle relay "ON" to connect to USB
    await autoKit.digitalRelay.on();
    await delay(5 * 1000);

    // Power DUT on
    await autoKit.power.on();

    // run flash container
    await new Promise<void>(async (resolve, reject) => {
        let flash = spawn('./run_container.sh',
            [
               '-a',
               'armv7',
               '-d',
               dram,
               '-i',
               filename
            ], 
            { 
                'stdio': 'inherit',
                'shell': true,
                'cwd': '/usr/app/iot-gate-imx8plus-flashtools'
            }
        )

        flash.on('exit', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject()
            }
        });
        flash.on('error', (err) => {
            reject(err);
        });
    });


    await autoKit.power.off();

    // simulate unplugging of the USB programming cable

    // VCC of the programming USB cable is connected to NO relay
    // toggle relay "OFF" to connect to disconnect USB
    await autoKit.digitalRelay.off();
    await delay(5 * 1000);

    await delay(powerOnDelay);
}

/**
 * 
 * Flash a given device type, automatically selecting the corresponding flashing method
 */
async function flash(filename: string, deviceType: string, autoKit: Autokit, port?: usbPort){
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
        case 'jetson': {
            await flashJetson(filename, autoKit, deviceType, flashProcedure.nvme);
            break;
        }
        case 'iot-gate': {
            if(port === undefined){
                throw new Error('No usb port specified!')
            }
            await flashIotGate(filename, autoKit, port, flashProcedure.dram)
        }
    }
}

export { flash }
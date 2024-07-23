import { exec, spawn } from 'mz/child_process';
import { delay } from 'bluebird';
import * as Bluebird from 'bluebird';
import * as retry from 'bluebird-retry';
import * as sdk from 'etcher-sdk';
import * as fs from 'fs/promises';
import { BlockDeviceAdapter } from 'etcher-sdk/build/scanner/adapters';
import { Autokit } from '../';
import { waitForPowerOff } from './powerDetection';

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
    const SD_MUX_DELAY = Number(process.env.SD_MUX_DELAY) || 1000*30

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

    await delay(SD_MUX_DELAY);
    
}

const KEY_DELAY = Number(process.env.KEY_DELAY) || 500;
async function keyboardSequence(autoKit: Autokit, keyboard: [string]){
    for(let key of keyboard){
        // press key
        await autoKit.keyboard.pressKey(key);
        await delay(KEY_DELAY);
    }
}

async function flashFlasher(filename: string, autoKit: Autokit, jumper: boolean, keyboard?:[string]){
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


    if(keyboard !== undefined){
        // Devices expect a monitor to be plugged - or they may not boot...
        await autoKit.video.startCapture({fake: true});
        console.log(`Starting keyboard sequence...`)
        keyboardSequence(autoKit, keyboard)
    }

    //small delay to ensure sd and jumper has toggled
    await delay(1000 * 10);

    await autoKit.power.on();

    await waitForPowerOff(autoKit);

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

async function flashUsbBoot(filename: string, autoKit: Autokit, port: usbPort, power: boolean, jumper: boolean, sb?: boolean){
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
    // This is the path to the folder containing the cm4 secureboot artifacts on the autokit
    const bootImageFolder = (sb) ? (process.env.SB_ARTIFACT || '/data/secure-boot-msd/') : undefined;

    console.log(bootImageFolder)

    const adapters: sdk.scanner.adapters.Adapter[] = [
        new BlockDeviceAdapter({
            includeSystemDrives: () => false,
            unmountOnSuccess: false,
            write: true,
            direct: true,
        }),
        new sdk.scanner.adapters.UsbbootDeviceAdapter(bootImageFolder),
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
                    drive.oWrite = true;
					drive.oDirect = true;
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
    const JETSON_FLASH_REPO_URL = process.env.JETSON_FLASH_REPO_URL || 'https://github.com/balena-os/jetson-flash.git';

    // now start the jetson flash tool with docker. 
    // build first

    try{ 
        await exec(`cd /usr/app/ && git clone ${JETSON_FLASH_REPO_URL}`);
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
    try{
        if(nvme){
            await new Promise<void>(async (resolve, reject) => {
                let build = spawn('docker',
                    [
                        'build',
                        '-t',
                        'jetson-flash-image',
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
                        autoKit.power.off();
                        reject(new Error(`Docker build exit code was: ${code}. Powered off DUT.`));
                    }
                });
                build.on('error', (err) => {
                    autoKit.power.off();
                    reject(new Error(`Error with docker build: ${err.message}. Powered off DUT.`));
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
                        autoKit.power.off();
                        console.log(`Got exit code ${code}.. error. Powered off DUT.`);
                        reject(new Error(`Docker build exit code was: ${code}`));
                    }
                });
                buildAndRun.on('error', (err) => {
                    autoKit.power.off();
                    reject(new Error(`Error with docker build: ${err.message}. Powered off DUT.`));
                });
            });
        }
    } catch (err: any){
        await autoKit.power.off();
        throw new Error(`Failed during jetson-flash container build: ${err.message}. Powered off DUT`);
    }

    await autoKit.power.on();
    await delay(5 * 1000);
    // run flash container
    console.log(`File path: ${filename}`)
    // Then run container
    try{
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
                    'jetson-flash-image',
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
                    autoKit.power.off();
                    console.log(`Got exit code ${code}.. error. Powered off DUT.`);
                    reject(new Error(`Docker run exit code was: ${code}`))
                }
            });
            flash.on('error', (err) => {
                autoKit.power.off();
                reject(new Error(`Error with docker run: ${err.message}. Powered off DUT.`));
            });
        });
    } catch(err:any){
        await autoKit.power.off();
        throw new Error(`Failed during jetson-flash container run: ${err.message}. Powered off DUT.`)
    }


    if(nvme){
        // wait for jetson to power off
        await waitForPowerOff(autoKit);
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

async function flashIotGate(filename: string, autoKit: Autokit, port: usbPort){
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
    try{
        await new Promise<void>(async (resolve, reject) => {
            let flash = spawn('./run_container.sh',
                [
                '-a',
                'armv7',
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
                    reject(new Error(`Docker run exit code was: ${code}`))
                }
            });
            flash.on('error', (err) => {
                reject(new Error(`Error with docker run: ${err.message}`));
            });
        });
    } catch(err:any){
        throw new Error(`IOT-gate-imx8plus flasher tool failed: ${err.message}`)
    }


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
            await flashUsbBoot(filename, autoKit, port, flashProcedure.power, flashProcedure.jumper, flashProcedure.sb);
            break;
        }
        case 'flasher': {
            await flashFlasher(filename, autoKit, flashProcedure.jumper, flashProcedure.keyboard);
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
            await flashIotGate(filename, autoKit, port)
        }
    }
}

export { flash }

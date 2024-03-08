// import all features
import { networkImplementations } from './features/network';
import { powerImplementations } from './features/power';
import { videoImplementations } from './features/video';
import { sdMuxImplementations } from './features/sd-mux';
import { serialImplementations } from './features/serial';
import { digitalRelayImplementations } from './features/digitalRelay';
import { keyboardImplementations } from './features/keyboard';

import { flash } from './flashing'


const { Command } = require("commander"); // add this line
const figlet = require("figlet");
import { version } from '../package.json';
import { Autokit } from './index';
// import configuration
let config = require('./config.json');
import { writeFile, readdir } from 'fs/promises';
import { extname } from 'path';

console.log(figlet.textSync("Autokit"));


//add the following line
const program = new Command();
const autoKit = new Autokit(config);

async function main(){
    program
    .version(version)
    .description("CLI for controlling autokit functions")


    function makePowerCommand() {
        const power = new Command('power');
        power
        .description("Command for toggling DUT power on / off")

        power
            .command('on')
            .description("Toggling DUT power on")
            .action(async () => {
               await autoKit.power.on();
            });
        power
            .command('off')
            .description("Toggling DUT power on")
            .action(async () => {
                await autoKit.power.off();
            });
        return power;
    }

    function makeSdMuxCommand() {
        const sd = new Command('sdMux');
        sd
        .description("Command for toggling SD card between DUT and autokit host")

        sd
            .command('host')
            .description("Toggle SD mux to host")
            .action(async () => {
                await autoKit.sdMux.toggleMux('host')
            });
        sd
            .command('dut')
            .description("Toggle SD mux to dut")
            .action(async () => {
                await autoKit.sdMux.toggleMux('dut')
            });
        return sd;
    }

    function makeBootSwitchCommand() {
        const relay = new Command('bootSwitch');
        relay
        .description("Command for toggling boot mode select jumpers/switches")

        relay
            .command('on')
            .description("Toggle boot switch on")
            .action(async () => {
                await autoKit.digitalRelay.on();
            });
        relay
            .command('off')
            .description("Toggle boot switch off")
            .action(async () => {
                await autoKit.digitalRelay.off();
            });
        return relay;
    }

    function makeNetworkCommand() {
        const nw = new Command('network');
        nw
        .description("Command for toggling SD card between DUT and autokit host")

        nw
            .command('ethernet')
            .description("Activate ethernet connection sharing")
            .action(async () => {
                await autoKit.network.createWiredNetwork();
            });
        nw
            .command('wifi')
            .description("Activate wifi-hotspot")
            .option('--ssid <value>', 'SSID of the created wifi hotspot')
            .option('--psk <value>', "wpa2 PSK of the created wifi hotspot")
            .action(async (options: any) => {
                await autoKit.network.createWirelessNetwork(options.ssid, options.psk)
            });
        return nw;
    }


    function makeFlashCommand() {
        const flash = new Command('flash');
        flash
        .description("Commands for flashing the DUT")

        flash
        .command('flashDevice')
        .description("Flash the DUT")
        .option("--deviceType <type>", "The device type slug of the device to flash. Consider using 'generic-<BOOT>' options")
        .option("--filename <value>", "The filename of the OS image to flash")
        .action(async (options:any) => {
            await autoKit.flash(options.filename, options.deviceType)
        });

        flash
        .command('list')
        .description("List available device types")
        .action(async () => {
            let files = await readdir(`${__dirname}/flashing/devices`);
            files.filter(file => {
                const extension = extname(file);
                console.log(file.replace(extension, ''))
            });
        });
        
        return flash;
    }

    function makeConfigureCommand(){
        const configure = new Command('configure')
        configure
        .description("Configure autoKit command line tool")


        configure
        .command('list')
        .description("List available configuration options")
        .action(async () => {
            // for each feature, list all implementations (in table)
            let list = {
                power: Object.keys(powerImplementations),
                sdMux: Object.keys(sdMuxImplementations),
                network: Object.keys(networkImplementations),
                video: Object.keys(videoImplementations),
                serial: Object.keys(serialImplementations),
                digitalRelay: Object.keys(digitalRelayImplementations),
                keyboard: Object.keys(keyboardImplementations)
            }
            
            console.table(list)

        })

        configure
        .command('set')
        .description("Set configuration variable. This is for selecting which of the hardware options you have connected physically to the autokit")
        .option('--feature <type>', 'the feature you want to set - use "configure list" to list all features')
        .option('--implementation <type>', 'the selected hardware implementation')
        .action(async (options:any) => {
            console.log(options)
            config[options.feature] = options.implementation
            console.log(config)
            await writeFile(`${__dirname}/config.json`, JSON.stringify(config));
        })

        configure
        .command('get')
        .action(async () => {
            console.table(config)
        })

        return configure
    }

    function makeSetupCommand(){
        const setup = new Command('setup')
        setup
        .description("setup autoKit command line tool - use every time you change configuration, or before each use")
        .command('list')
        .action(async () => {
            await autoKit.setup();
        })

        
        return setup
    }



    program.addCommand(makePowerCommand());
    program.addCommand(makeSdMuxCommand());
    program.addCommand(makeBootSwitchCommand());
    program.addCommand(makeNetworkCommand());
    program.addCommand(makeFlashCommand());
    program.addCommand(makeConfigureCommand());
    program.addCommand(makeSetupCommand());


    program.parse(process.argv);
}

main();
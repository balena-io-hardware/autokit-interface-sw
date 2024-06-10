import * as repl from 'repl';
import { Autokit } from './index'

const autokitConfig = {
    power: process.env.POWER || 'dummyPower',
    sdMux: process.env.SD_MUX || 'dummySdMux',
    network: process.env.NETWORK ||  'dummyNetwork',
    video: process.env.VIDEO || 'linuxVideo',
    serial: process.env.SERIAL || 'dummySerial',
    usbBootPort: {
        port: process.env.USB_BOOT_PORT || '4',
        location: process.env.USB_BOOT_PORT_LOC || '1-1'
    },
    digitalRelay: process.env.DIGITAL_RELAY || 'dummyPower',
    keyboard: process.env.KEYBOARD || 'dummyKeyboard'
}

const AutoKit = new Autokit(autokitConfig);
async function setup(){
    await AutoKit.setup();

    const replServer = repl.start();
	replServer.context['Autokit'] = AutoKit;
	

	replServer.on('exit', () => {
		AutoKit.teardown();
	});
    
}
setup();
console.log(`can now use "Autokit" object in REPL!`);
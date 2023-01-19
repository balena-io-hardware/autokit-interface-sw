// import all features
import { networkImplementations } from './features/network';
import { powerImplementations } from './features/power';
import { videoImplementations } from './features/video';
import { sdMuxImplementations } from './features/sd-mux';
import { serialImplementations } from './features/serial';
import { digitalRelayImplementations } from './features/digitalRelay';

import { flash } from './flashing'

export class Autokit {
    private config: AutokitConfig;
    public power: Power;
    public network: Network;
    public video : Video;
    public sdMux: SdMux;
    public serial: Serial;
    public digitalRelay: DigitalRelay;

     /**
     * @param config - AutokitConfig object, MUST define every implementation. You can use a Dummy one if needed.
     **/
    constructor(config: AutokitConfig){
        this.config = config;
        this.power = new powerImplementations[this.config.power]();
        this.network = new networkImplementations[this.config.network]();
        this.video = new videoImplementations[this.config.video]();
        this.sdMux = new sdMuxImplementations[this.config.sdMux]();
        this.serial = new serialImplementations[this.config.serial]();
        this.serial = new serialImplementations[this.config.serial]();
        this.digitalRelay = new digitalRelayImplementations[this.config.digitalRelay]
    }

    /**
     * Initializes every implementation according to their own defined setup method.
     **/
    async setup(){
        // TODO: for each feature, detect the implementation - then create the instance of the class
        // For now, let the user specify the hardware configuration with a json object
        console.log(`Setting up automation kit...`)
        await this.power.setup();
        await this.network.setup();
        await this.video.setup();
        await this.sdMux.setup();
        await this.serial.setup();
        await this.digitalRelay.setup();
        console.log(`Setup completed!`)
        // TODO check for what features are enabled, and expose this to the user - give a summary
    }


    /**
     * Flash a DUT from a file path.
     **/
    async flash(filename: string, deviceType: string){
        await flash(filename, deviceType, this ,this.config.usbBootPort);
    }

    /**
     * Calls the teardown method on every implementation. 
     **/
    async teardown(){
        console.log('Tearing down Autokit...')
        await this.power.teardown();
        await this.network.teardown();
        await this.video.teardown();
        await this.sdMux.teardown();
        await this.serial.teardown();
        await this.digitalRelay.teardown();
    }
}
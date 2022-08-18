// import all features
import { networkImplementations } from './features/network';
import { powerImplementations } from './features/power';
import { videoImplementations } from './features/video';
import { sdMuxImplementations } from './features/sd-mux';

import { flash } from './flashing'

export class Autokit{
    private config: AutokitConfig;
    public power: Power;
    public network: Network;
    public video : Video;
    public sdMux: SdMux;

    constructor(config: AutokitConfig){
        this.config = config;
        this.power = new powerImplementations[this.config.power]();
        this.network = new networkImplementations[this.config.network]();
        this.video = new videoImplementations[this.config.video]();
        this.sdMux = new sdMuxImplementations[this.config.sdMux]();
    }

    async setup(){
        // TODO: for each feature, detect the implementation - then create the instance of the class
        // For now, let the user specify the hardware configuration with a json object
        console.log(`Setting up automation kit...`)
        await this.power.setup();
        await this.network.setup();
        await this.video.setup();
        await this.sdMux.setup();
        console.log(`Setup completed!`)
        // TODO check for what features are enabled, and expose this to the user - give a summary
    }


    // flash a DUT from a file
    async flash(filename: string, deviceType: string){
        await flash(filename, deviceType, this ,this.config.usbBootPort);
    }

    async teardown(){
        console.log('Tearing down Autokit...')
        await this.power.teardown();
        await this.network.teardown();
        await this.video.teardown();
        await this.sdMux.teardown();
    }
}
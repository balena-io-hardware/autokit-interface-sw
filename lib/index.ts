// import all functions
import { networkNodes } from './functions/network';
import { powerNodes } from './functions/power';
import { videoNodes } from './functions/video';
import { sdMuxNodes } from './functions/sd-mux';
import { serialNodes } from './functions/serial';
import { digitalRelayNodes } from './functions/digitalRelay';

export { Utils } from './utils';

export class Autokit {
    private config: AutokitConfig;
    public power: Power;
    public network: Network;
    public video : Video;
    public sdMux: SdMux;
    public serial: Serial;
    public digitalRelay: DigitalRelay;

    /*
    Autokit: {
        functions:{
            [
                power: {
                    nodes: [
                        C2: {
                            status: "connected",
                            type: "autokitRelay"
                        },
                        C3: {
                            status: "disconnected",
                            type: autoKitSdMux
                        }
                    ]
                },
                network: {

                }
            ]
            
        }
    }

    Autokit.functions.nodes.C1?.powerOn()
    */


     /**
     * @param config - AutokitConfig object, MUST define every Node. You can use a Dummy one if needed.
     **/
    constructor(config: AutokitConfig){
        this.config = config;
        this.power = new powerNodes[this.config.power]();
        this.network = new networkNodes[this.config.network]();
        this.video = new videoNodes[this.config.video]();
        this.sdMux = new sdMuxNodes[this.config.sdMux]();
        this.serial = new serialNodes[this.config.serial]();
        this.serial = new serialNodes[this.config.serial]();
        this.digitalRelay = new digitalRelayNodes[this.config.digitalRelay]
    }

    /**
     * Initializes every Node according to their own defined setup method.
     **/
    async setup(){
        // TODO: for each feature, detect the Node - then create the instance of the class
        // For now, let the user specify the hardware configuration with a json object
        console.log(`Setting up automation kit...`)
        await this.power.setup();
        await this.network.setup();
        await this.video.setup();
        await this.sdMux.setup();
        await this.serial.setup();
        await this.digitalRelay.setup();
        console.log(`Setup completed!`)
        // TODO check for what functions are enabled, and expose this to the user - give a summary
    }


    /**
     * Calls the teardown method on every Node. 
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
// import all functions
import { networkNodes } from './functions/network';
import { powerNodes } from './functions/power';
import { videoNodes } from './functions/video';
import { sdMuxNodes } from './functions/sd-mux';
import { serialNodes } from './functions/serial';
import { digitalRelayNodes } from './functions/digitalRelay';

export { Utils } from './utils';

export class Autokit {
   
    private nodes: any


    // setup
    async init(){
        // function to populate node tree - pedros udev rules thing?
        /*
            1. add giant udev rule
            2. run pedros script to fetch json object of tree https://github.com/cheery/node-udev
            3. for each object in the tree, create an instance of the node class??
                3.1 for the following tree: 
                {
                    3-1: {usbRelay}
                    3-2: {sdMux}
                    3-3: {usbRelay}
                }

                autokit.nodes.C1 = new Nodes[usbRelay]()

                class UsbRelay implements Power {
                    async on()
                    async off()
                }

                interface Power extends Node {
                    on()
                    off()
                }

                interface Node {
                    id: string
                    ...
                    ...
                }
        */
    }

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


    Autokit: {
            nodes: [
                C2: {
                    status: "connected",
                    type: "autokitRelay"
                    function: "relay"
                },
                C4: {
                    status: "connected",
                    type: "autokitRelay"
                    function: "relay"
                },
                C3: {
                    status: "disconnected",
                    type: autoKitSdMux
                    function: "sdMux"
                }
            ]    
        }
    }

    AutoKit.functions.nodes.C1?.powerOn()
    AutoKit.utils.powerOn(){
        autoKit.nodes.power.on() // C1 always power 
    }
    
    // user wanted to toggle the other relay they had connected (they plugged it into C5 - so they know its there)
    autoKit.nodes[defaults.power].power.on()


    defaults {
        mainsPower: C1,
        sdMux: C2, 
        video: C3,
        ethernet: C4
    }

    // on order without sd mux
    defaults {
        mainsPower: C1,
        uhubctl: C2, 
        video: C3,
        ethernet: C4
    }

    // on order with digital relay (toggle boot select pins)
    defaults {
        mainsPower: C1,
        sdMux: C2, 
        video: C3,
        ethernet: C4,
        bootSelect: C5
    }

    utils.powerOn(method){
        switch(method):
            case(mains):
                autoKit.nodes[defaults.power].power.on()
            case(usbboot):
                autoKit.nodes[defaults.uhubctl].power.on()
                autoKit.nodes[defaults.power].power.on()
            case(button):
                autoKit.nodes[defaults.bootSelect].toggle.on()
               
    }
        
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
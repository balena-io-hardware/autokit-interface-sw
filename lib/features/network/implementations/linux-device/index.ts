import NetworkManager  from './networkManager';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class LinuxNetwork implements Network{
    private networkManager: NetworkManager;
    public wirelessIface = '';
    public wiredIface = '';
    constructor(){
        this.networkManager = new NetworkManager()
    }
    
    // TODO : Dynamically find the ethernet oand wifi interfaces to be used
    async setup(){
        // First get lshw
        /*const lshw = await execAsync('lshw -json -class network');
        const lshwJson = JSON.parse(lshw.stdout);
        for(let networkDevice of lshwJson){
            if(networkDevice.capabilities.wireless === 'Wireless-LAN'){
                // we only want to use an unused interface - so the tester unit doesn't lose its network connection
                if((networkDevice.configuration.link !== 'yes') && (networkDevice.disabled !== true)){
                    this.wirelessIface = networkDevice.logicalname
                }
            }

            if(networkDevice.capabilities.ethernet === true){
                // we only want to use an unused interface - so the tester unit doesn't lose its network connection
                if(networkDevice.configuration.link === 'no'){
                    this.wiredIface = networkDevice.logicalname
                }
            }
        }*/
        this.wirelessIface = process.env.WIFI_IF || 'wlan0';
        this.wiredIface = process.env.WIRED_IF || 'eth1';
    }

    async createWiredNetwork(): Promise<void> {
        console.log('Creating wired connection...');
        await this.networkManager.addWiredConnection(this.wiredIface);
    }

    async createWirelessNetwork(ssid?: string | undefined, psk?: string) {
        console.log(`Creating wireless connection on interface ${this.wirelessIface}`);
        if(ssid === undefined){
            ssid = 'autokit-wifi';
        }
        if (psk === undefined){
            psk = 'autokit-wifi-psk'
        }
        await this.networkManager.addWirelessConnection(ssid, psk, this.wirelessIface);
    }

    async enableInternet(){
        await execAsync('echo 0 > /proc/sys/net/ipv4/ip_forward')
    };

    async disableInternet(){
        await execAsync('echo 1 > /proc/sys/net/ipv4/ip_forward')

    };

    // tear down the connection
    async teardown(){
        await this.networkManager.teardown();
    }
}
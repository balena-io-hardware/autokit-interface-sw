const debug = require("debug")("autokit:DummyNetwork");

export class DummyNetwork implements Network {
    public wirelessIface = '';
    public wiredIface = '';
    constructor() {
    }

    async setup() {
        debug("Setting up");
    }

    async createWiredNetwork(): Promise<void> {
        debug("Creating wired connection");
    }

    async createWirelessNetwork(ssid?: string | undefined, psk?: string) {
        debug("Creating wireless connection with SSID: %o PSK: %o", ssid, psk);
    }

    async enableInternet(){
        debug("Enabling internet");
    };

    async disableInternet(){
        debug("Disabling internet");
    };

    // tear down the connection
    async teardown(){
        debug("Tearing down");
    }
}
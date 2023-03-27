interface Base{
    setup(): Promise<void>;
    teardown(): Promise<void>;
}


interface Power extends Base{
    on(voltage?: number): Promise<void>;
    off(): Promise<void>;
    getState(): Promise<string>;
}

interface DigitalRelay extends Base{
    on(voltage?: number): Promise<void>;
    off(): Promise<void>;
    getState(): Promise<string>;
}

interface Network extends Base{
    createWiredNetwork(): Promise<void>;
    createWirelessNetwork(ssid?: string, psk?: string): Promise<void>;
    wiredIface: string;
    wirelessIface: string;
}

interface Video extends Base{
    captureFolder: string;
    startCapture(): Promise<string>;
    stopCapture(): Promise<void>;
}

interface SdMux extends Base{
    toggleMux(state: string): Promise<void>;
    DEV_SD: string;
}

interface Serial extends Base{
    serial: any;
    write(data: string): Promise<string | void>;
    read(): Promise<string>;
    open(): Promise<void>;
    close(): Promise<void>;
}

// specify which peripherals are in use
interface AutokitConfig{
    power: string;
    sdMux: string;
    network: string; 
    video: string;
    usbBootPort?: string;
    serial: string;
    digitalRelay: string;
}

// utility from angular
interface Type<T> extends Function { new (...args: any[]): T; }
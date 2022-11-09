const debug = require("debug")("autokit:DummySerial");

export class DummySerial implements Serial {
    public serial : undefined;
    constructor(baudRate = 115200){
        debug("Constructed with baudrate %o", baudRate);
    }

    async setup(): Promise<void> {
        debug("Setting up");
    }

    async open(){
        debug("Opening serial port");
    }

    async write(data: string){
        debug("Writing string %o", data);
    }


    async close(){
        debug("Closing serial port");
    }
    

    async teardown(): Promise<void> {
        debug("Tearing down");
    }
            
}

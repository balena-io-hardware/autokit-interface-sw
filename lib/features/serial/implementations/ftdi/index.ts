const SerialPort  = require('serialport');

export class Ftdi implements Serial {
    public DEV_SERIAL = '/dev/ttyUSB0' || process.env.DEV_SERIAL;
    public serial : any;
    constructor(baudRate = 115200){
        this.serial = new SerialPort(
            this.DEV_SERIAL,
            {
                baudRate: baudRate,
                autoOpen: false,
            });
    
    }

    async setup(): Promise<void> {
    }

    async open(){
        if(this.serial.isOpen){
            console.log(`Serial already open!`)
        } else {
            this.serial.open();
        }
    }

    async write(data: string): Promise<string | void>  {
        if(this.serial.isOpen){
                this.serial.write(`${data}\r`);
        } else {
            return `Serial connection not open`
        }
    }

    async read(): Promise<string>{
        if(this.serial.isOpen){
            let res = this.serial.read();
            if(res !== null){
                return (res.toString())
            } else {
                return 'No response from DUT...'
            }
        } else {
            return `Serial connection not open`
        }
    }

    async close(): Promise<void>{
        if(this.serial.isOpen){
            this.serial.close();
        } else (
            console.log('Serial already closed!')
        )
    }
    

    async teardown(): Promise<void> {
        await this.close()
    }
            
}

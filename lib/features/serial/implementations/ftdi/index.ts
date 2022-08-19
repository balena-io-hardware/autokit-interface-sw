import { SerialPort } from "serialport";
import { delay } from 'bluebird';

export class Ftdi implements Serial {
    public DEV_SERIAL = '/dev/ttyUSB0' || process.env.DEV_SERIAL;
    public serial : SerialPort;
    constructor(baudRate = 115200){
        this.serial = new SerialPort({
            path: this.DEV_SERIAL,
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

    async write(data: string){
        if(this.serial.isOpen){
                this.serial.write(`${data}\r`);
                // need to wait here - TODO: make it smarter
                await delay(1000 * 5);
                console.log(`This is actually new`)
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


    async close(){
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

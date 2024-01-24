const SerialPort  = require('serialport');

export class Rpi0Keyboard implements Keyboard {
    public DEV_SERIAL = '/dev/ttyUSB0' || process.env.DEV_SERIAL;
    public BAUD_RATE = 115200;
    public serial : any;

    constructor(){
        this.serial = null;
    }

    async setup(): Promise<void> {
        console.log(`Setting up serial keyboard..., using: ${this.DEV_SERIAL}`);

        await new Promise<void>(async(resolve, reject) => {
            this.serial = new SerialPort(
                this.DEV_SERIAL,
                {
                baudRate: this.BAUD_RATE,
                autoOpen: true,
            });

            this.serial.on('open', async () => {
                console.log(`Serial port opened`);
                resolve();
            })

            this.serial.on('error', async(err:any) => {
                console.log('Error: ', err.message)
                reject();
              })
        }).catch(() => {
            console.log(`Opening failed...`)
        })
    }

    async pressKey(key: string): Promise<string | void>  {
        if(this.serial !== null){    
            if(this.serial.isOpen){
                    console.log(`Writing --${key} \r\n`)
                    this.serial.write(`--${key} \r\n`);
            } else {
                console.log(`Serial connection not open`)
                return `Serial connection not open`
            }
        } else {
            console.log(`Serial port not initialised!`);
        }
    }

    async teardown(): Promise<void> {
    }
            
}

import { TestBotHat } from '@balena/testbot';

export class TestbotSdMux implements SdMux {
    public DEV_SD = '/dev/disk/by-id/usb-Generic_Ultra_HS-SD_MMC_000008264001-0:0'
    private testbot: TestBotHat;
    constructor(){
        this.testbot = new TestBotHat();
    }

    async setup(): Promise<void> {
        await this.testbot.setup();
    }

    async toggleMux(state: string): Promise<void> {
        if(state === 'host'){
            console.log('Switching SD card to host');
            await this.testbot.switchSdToHost(1000);
        } else if(state === 'dut'){
            console.log('Switching SD card to DUT');
            await this.testbot.switchSdToDUT(1000);
        }
    }

    async teardown(): Promise<void> {
        
    }
            
}

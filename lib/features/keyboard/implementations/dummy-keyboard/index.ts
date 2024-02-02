export class DummyKeyboard implements Keyboard {
    constructor(){
    }

    async setup(): Promise<void> {
        console.log(`Dummy keyboard setup`)
    }

    async pressKey(key: string): Promise<string | void>  {
        console.log(`Dummy keyboard ${key} pressed!`)
    }

    async teardown(): Promise<void> {
    }
            
}

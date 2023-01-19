const USBRelay = require("@balena/usbrelay");
const util = require('util');

//const relay = new USBRelay(`/dev/hidraw2`);
//console.log(USBRelay.Relays[0])


//console.log(util.inspect(USBRelay.Relays, { colors: true, depth: 5}));

console.log(USBRelay.Relays[1].getSerialNumber())
console.log(USBRelay.Relays[1].device)

let relays = USBRelay.Relays 

// iterate through the array, and find the relay that is associated with power
// if there is only one relay, then it doesn't matter
if(relays.length === 1){
    this.relay = new USBRelay(); //gets the first connected relay
} else{
    for(let relay of relays){
        console.log(relay.getSerialNumber())
        console.log(relay.devicePath)
    



    }
}



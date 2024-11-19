import { Autokit } from "../..";
import { waitForPowerOffEthernet } from "./ethernet";
import { waitForPowerOffSerial } from "./serial";

const powerOffSelector = process.env.POWER_OFF_SELECTOR || 'ethernet'

const powerOffFunctions: {[key: string]: (autoKit: Autokit)  => Promise<void> } = {
	ethernet: waitForPowerOffEthernet,
	serial: waitForPowerOffSerial,
};

const waitForPowerOff = powerOffFunctions[powerOffSelector];


export { waitForPowerOff }
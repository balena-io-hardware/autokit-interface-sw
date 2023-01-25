import { flash, Method } from "./flash";
import { Autokit } from '../';


export module Utils {

    /**
         * Flash a DUT from a file path.
    **/
    async function flash(filename: string, method: Method, autoKit: Autokit ){
        await flash(filename, method, autoKit);
    }
}
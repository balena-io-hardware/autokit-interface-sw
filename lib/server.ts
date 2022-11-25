import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as http from 'http';

import { Stream } from 'stream';
import * as fs from 'fs';
import * as tar from 'tar-fs';
import * as util from 'util';
const pipeline = util.promisify(Stream.pipeline);
import { createGzip, createGunzip } from 'zlib';

import { Autokit } from '.';

const jsonParser = bodyParser.json();
const app = express();
const httpServer = http.createServer(app);

const CONFIG_PATH = `/data/config.json`
let validConfig = false;
let configErr: any = null;

async function main(){
    // read configuration at startup
    
    const autokitConfigDefault: AutokitConfig = {
        power: 'dummyPower',
        sdMux: 'dummySdMux',
        network: 'dummyNetwork',
        video: 'dummyVideo',
        usbBootPort: '4',
        serial: 'dummySerial'
    }

    let autokitConfig = autokitConfigDefault;

    try{
        const readConfFile = await fs.promises.readFile(CONFIG_PATH);
        autokitConfig = JSON.parse(readConfFile.toString());
    } catch (e){
        console.log(`No config file found - using default configuration`)
        validConfig = true
    }


    let autoKit: Autokit;

    try{
        autoKit = new Autokit(autokitConfig);
        await autoKit.setup();
        validConfig = true
    }catch(e){
        console.log(`Invalid Autokit configuration, Error: ${e}`)
        configErr = e;
        validConfig = false
    }

    /* Power */
    app.post(
        '/power/on',
        async (
            _req: express.Request,
            res: express.Response,
            next: express.NextFunction,
        ) => {
            try {
                await autoKit.power.on();
                res.send('OK');
            } catch (err) {
                next(err);
            }
        },
    );

    app.post(
        '/power/off',
        async (
            _req: express.Request,
            res: express.Response,
            next: express.NextFunction,
        ) => {
            try {
                await autoKit.power.off();
                res.send('OK');
            } catch (err) {
                next(err);
            }
        },
    );

    app.get(
        '/power/state',
        async (
            _req: express.Request,
            res: express.Response,
            next: express.NextFunction,
        ) => {
            try {
                let state = await autoKit.power.getState();
                res.send(state);
            } catch (err){
                next(err)
            }
        },
    );



    /* Network */
    app.post(
        '/network/createWired',
        async (
            _req: express.Request,
            res: express.Response,
            next: express.NextFunction,
        ) => {
            try {
                await autoKit.network.createWiredNetwork();
                res.send('OK');
            } catch (err) {
                next(err);
            }
        },
    );

    app.post(
        '/network/createWireless',
        jsonParser,
        async (
            req: express.Request,
            res: express.Response,
            next: express.NextFunction,
        ) => {
            try {
                await autoKit.network.createWirelessNetwork(req.body.ssid, req.body.psk);
                res.send('OK');
            } catch (err) {
                next(err);
            }
        },
    );

    /* Serial */
    app.post(
        '/serial/open',
        async (
            req: express.Request,
            res: express.Response,
            next: express.NextFunction,
        ) => {
            try {
                await autoKit.serial.open();
                res.send('OK');
            } catch (err) {
                next(err);
            }
        },
    );

    app.post(
        '/serial/close',
        async (
            req: express.Request,
            res: express.Response,
            next: express.NextFunction,
        ) => {
            try {
                await autoKit.serial.close();
                res.send('OK');
            } catch (err) {
                next(err);
            }
        },
    );

    app.post(
        '/serial/write',
        jsonParser,
        async (
            req: express.Request,
            res: express.Response,
            next: express.NextFunction,
        ) => {
            try {
                let result = await autoKit.serial.write(req.body.data);
                res.send(result);
            } catch (err) {
                next(err);
            }
        },
    );

    /* video */
    app.post(
        '/video/startCapture',
        async (
            _req: express.Request,
            res: express.Response,
            next: express.NextFunction,
        ) => {
            try {
                await autoKit.video.startCapture();
                res.send('OK');
            } catch (err) {
                next(err);
            }
        },
    );

    app.post(
        '/video/stopCapture',
        async (
            _req: express.Request,
            res: express.Response,
            next: express.NextFunction,
        ) => {
            try {
                await autoKit.video.stopCapture();
                // send a .tar.gz of all captured images
                const line = pipeline(
                    tar.pack(autoKit.video.captureFolder),
                    createGzip({ level: 6 }),
                    res,
                ).catch((err: Error) => {
                    throw err;
                });
                await line;
                res.send('OK');
            } catch (err) {
                next(err);
            }
        },
    );


    app.post(
        '/flash',
        jsonParser,
        async (
            req: express.Request,
            res: express.Response,
            next: express.NextFunction,
        ) => {
            try {
                await autoKit.flash(req.body.filename, req.body.deviceType);
                res.send('OK');
            } catch (err) {
                next(err);
            }
        },
    );

    app.post(
        '/teardown',
        async (
            _req: express.Request,
            res: express.Response,
            next: express.NextFunction,
        ) => {
            try {
                await autoKit.teardown();
                res.send('OK');
            } catch (err) {
                next(err);
            }
        },
    );

    app.post(
        '/config',
        jsonParser,
        async (
            req: express.Request,
            res: express.Response,
            next: express.NextFunction,
        ) => {
            try {
                // first tear down existing autokit configuration
                await autoKit.teardown();

                // each field that is specified, change it in file
                for(let field in req.body){
                    console.log(`Trying to change ${field} to ${req.body[field]}`)
                    autokitConfig[field] = req.body[field];
                }

                try{
                    autoKit = new Autokit(autokitConfig);
                    await autoKit.setup();
                    // write new config to save it across restarts/reboots
                    await fs.promises.writeFile(CONFIG_PATH, JSON.stringify(autokitConfig));     
                    configErr = null;   
                    validConfig = true       
                }catch(e){
                    console.log(`Invalid Autokit configuration, ${e}`);
                    validConfig = false
                    configErr = e;
                    throw e
                }

                res.send('OK');
            } catch (err) {
                next(err);
            }
        },
    );

    app.get(
        '/config',
        async (
            _req: express.Request,
            res: express.Response,
            next: express.NextFunction,
        ) => {
            try {
                res.send(
                    {
                        valid: validConfig,
                        config: autokitConfig
                    }
                );
            } catch (err){
                next(err)
            }
        },
    );

    app.get(
        '/config/options',
        async (
            _req: express.Request,
            res: express.Response,
            next: express.NextFunction,
        ) => {
            try {
                res.send(autoKit.configOptions);
            } catch (err){
                next(err)
            }
        },
    );


    // Start server

    const server = app.listen(80, () => {
		console.log(`Worker http listening on port 80`);
	});
}

main();

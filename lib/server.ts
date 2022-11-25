import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as multer from 'multer';
import * as http from 'http';

import { Stream } from 'stream';
import * as tar from 'tar-fs';
import * as util from 'util';
const pipeline = util.promisify(Stream.pipeline);
import { createGzip, createGunzip } from 'zlib';

import { Autokit } from '.';

const jsonParser = bodyParser.json();
const app = express();
const upload = multer({ dest: '/data' })
const httpServer = http.createServer(app);

const autokitConfig = {
    power: process.env.POWER || 'dummyPower',
    sdMux: process.env.SD_MUX || 'dummySdMux',
    network: process.env.NETWORK ||  'dummyNetwork',
    video: process.env.VIDEO || 'dummyVideo',
    usbBootPort: process.env.USB_BOOT_PORT || '4',
    serial: process.env.SERIAL || 'dummySerial'
}

async function main(){
    const autoKit = new Autokit(autokitConfig);

    await autoKit.setup();

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

    /*app.post(
        '/network/enableInternet',
        async (
            _req: express.Request,
            res: express.Response,
            next: express.NextFunction,
        ) => {
            try {
                await autoKit.network.enableInternet();
                res.send('OK');
            } catch (err) {
                next(err);
            }
        },
    );

    app.post(
        '/network/disableInternet',
        async (
            _req: express.Request,
            res: express.Response,
            next: express.NextFunction,
        ) => {
            try {
                await autoKit.network.();
                res.send('OK');
            } catch (err) {
                next(err);
            }
        },
    );*/

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
                ).catch((error) => {
                    throw error;
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
        '/uploadImage',
        upload.single('image'),
        async (
            req: express.Request,
            res: express.Response,
            next: express.NextFunction,
        ) => {
            if(!req.file) {
                res.send({
                    status: false,
                    message: 'No file uploaded'
                });
            } else {       
                res.send({
                    status: true,
                    metadata: req.file
                });
            }
        }
    )

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

    // Start server

    const server = app.listen(80, () => {
		console.log(`Worker http listening on port 80`);
	});
}

main();

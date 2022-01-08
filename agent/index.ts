import WebSocket, { WebSocketServer } from 'ws';
import { exec } from 'child_process';
import { Key, keyboard, mouse, Point, screen } from "@nut-tree/nut-js";
import { imageResource } from '@nut-tree/nut-js';
//@ts-ignore
import sleepMode from 'sleep-mode';
require("@nut-tree/template-matcher");

// We may be able to get the real location of steam.
// On install, steam registers an URI handler for steamapp://, if we were to find where that URI handler points, we'd have the steam exe location.
const steamPath = '"C:\\Program Files (x86)\\Steam\\steam.exe"';
screen.config.resourceDirectory = "./patterns/";

function isSteamRunning() {
    return new Promise<boolean>(resolve => {
        exec('tasklist', (err, stdout, stderr) => {
            resolve(stdout.includes('steam.exe'));
        });
    });
}

function waitUntilSteamIsOff() {
    return new Promise<void>(async resolve => {
        const steamRunning = await isSteamRunning();
        if (steamRunning) {
            setTimeout(() => resolve(waitUntilSteamIsOff()), 5000);
        } else {
            resolve();
        }
    });
}

function waitUntilSteamIsOn() {
    return new Promise<void>(async resolve => {
        const steamRunning = await isSteamRunning();
        if (!steamRunning) {
            setTimeout(() => resolve(waitUntilSteamIsOn()), 5000);
        } else {
            resolve();
        }
    });
}

function getSendableLog(msg: string) {
    return JSON.stringify({type: 'log', payload: msg});
}

function promiseWait(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}

const server = new WebSocketServer({port: 44639});
server.on('connection', (ws) => {
    ws.addEventListener('message', async (msg) => {
        let obj: any;
        try {
            obj = JSON.parse(msg.data as string);
            console.log(msg.data);
        } catch (e) {
            obj = {type: null};
            // console.error(msg);
        }
        if (obj.type === 'login') {
            ws.send(getSendableLog('Attempting steam shutdown'));
            exec(steamPath + ' -shutdown');
            waitUntilSteamIsOff().then(() => {
                ws.send(getSendableLog('Steam is off'));
                ws.send(getSendableLog('Attempting steam login'));
                exec(`${steamPath} -login ${obj.account.user} ${obj.account.password}`);
                waitUntilSteamIsOn().then(() => {
                    ws.send(getSendableLog('Steam process launched'));
                    screen.waitFor(imageResource("./steam.png"), 20000).then(async (region) => {
                        ws.send(getSendableLog('Steam app found on taskbar'));
                        await mouse.setPosition(new Point(0, 0));
                        await mouse.leftClick();
                        await mouse.setPosition(new Point(region.left + region.width / 2, region.top + region.height / 2));
                        await mouse.leftClick();
                        try {
                            await screen.waitFor(imageResource("./guard.png"));
                            sendSteamGuard(ws);
                        } catch (e) {}
                    }).catch(() => {
                        ws.send(getSendableLog('Steam app not found on taskbar, praying for the best'));
                        screen.find(imageResource('./guard.png')).then(async region => {
                            await mouse.setPosition(new Point(region.left, region.top));
                            await mouse.leftClick();
                            sendSteamGuard(ws);
                        }).catch(() => {
                            blindGuard(obj, ws);
                        });
                    });
                });
            });
        } else if (obj.type === 'guard') {
            await keyboard.type(obj.payload);
            await keyboard.type(Key.Enter);
            ws.send(getSendableLog('Steam guard code typed (may not be successfull)'));
        }  else if (obj.type === 'sleep') {
            ws.send(getSendableLog('Going to sleep 💤'));
            sleepMode((err, stderr, stdout) => {});
        }
    });
});
async function blindGuard(obj: any, ws: WebSocket) {
    if (obj.account.steamGuard) {
        ws.send(getSendableLog('We can\'t find the steam guard prompt, but this account should have it. Attempting blind click'));
        await mouse.setPosition(new Point((await screen.width()) / 2 + 20, (await screen.height()) / 2 + 20));
        await mouse.leftClick();
    }
}

function sendSteamGuard(ws: WebSocket) {
    ws.send(getSendableLog('Steam guard requested'));
    const send = { type: 'guard' };
    ws.send(JSON.stringify(send));
}


import express from 'express';
import fs from 'fs';
import { Config } from './config';
import WebSocket, { WebSocketServer } from 'ws';
import wol from 'wol'

const app = express()
const port = 3000
let config: Config;
let client: WebSocket | null = null;
let state: 'offline' | 'online' | 'connecting' = 'offline';

// Tries to stablish and mantain a connection to the PC running Steam Link
function keepConnectionToRemote() {
    if (client == null) {
        client = new WebSocket(config.remoteURL);
        state = 'connecting';
        client.addEventListener('open', () => {
            state = 'online';
            informFrontEndOfStatus();
        });
        client.addEventListener('close', () => {
            treatClientAsClosed();
        });
        client.addEventListener('error', () => {
            treatClientAsClosed();
        });
        client.addEventListener('message', ev => {
            const obj = JSON.parse(ev.data as string);
            if (obj.type === 'log') {
                informFrontEndOfLog(obj.payload);
            } else if (obj.type === 'guard') {
                informFrontEndOfGuard();
            }
        });
    } else if (client.readyState === client.OPEN) {
        client.send('ping');
    }
    informFrontEndOfStatus();
}

function treatClientAsClosed() {
    state = 'offline';
    client = null;
    informFrontEndOfStatus();
}

// Inform the frontend of the status of the SteamLink app
function informFrontEndOfStatus() {
    for (const front of wsServer.clients) {
        const obj = {type: 'status', payload: state}
        front.send(JSON.stringify(obj));
    }
}

function informFrontEndOfLog(message: string) {
    for (const front of wsServer.clients) {
        const obj = {type: 'log', payload: message}
        front.send(JSON.stringify(obj));
    }
}

function informFrontEndOfGuard() {
    for (const front of wsServer.clients) {
        const obj = {type: 'guard'}
        front.send(JSON.stringify(obj));
    }
}

function loginRemoteMachine(user: string) {
    if (client && client.readyState === client.OPEN ) {
        informFrontEndOfLog('Connected to remote machine, sending it the login request');
        const account = config.accounts.find(account => account.user === user);
        const obj = {type: 'login', account};
        client.send(JSON.stringify(obj))
    } else {
        informFrontEndOfLog('Couldn\'t connect to the machine on time. Try again when the status is online');
    }
}

// Settings things up
fs.readFile('./config.json', {encoding: 'utf8'}, (err, data) => {
    if (err != null) {
        console.error('Config file not found, please be sure to copy conf-dummy.json into conf.json and fill the details');
        process.exit(1);
    }
    config = JSON.parse(data);
    keepConnectionToRemote();
    setInterval(keepConnectionToRemote, 20000);
});

// Running HTTP server
app.get('/', (req, res) => {
    fs.readFile('./front/index.html', {encoding: 'utf8'}, (err, data) => {
        let buttons = '';
        for (const user of config.accounts) {
            buttons += `<button onclick="buttonClick()">${user.user}</button>\n`;
        }
        let newHtml = data.replace('$buttons', buttons);
        res.send(newHtml);
    });
});

const server = app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});

// Running ws server
const wsServer = new WebSocketServer({clientTracking: true, server });
wsServer.on('connection', (ws) => {
    informFrontEndOfStatus();
    ws.on("message", (data: string) => {
        const obj = JSON.parse(data);
        console.log(obj);
        if (obj.type === 'login') {
            if (state !== 'online') {
                informFrontEndOfLog('Machine was asleep, sending a Wake On Lan');
                wol.wake(config.remoteMAC);
                setTimeout(() => loginRemoteMachine(obj.payload), 30000);
            } else {
                loginRemoteMachine(obj.payload);
            }
        } else if (obj.type === 'guard') {
            if (client != null) {
                client.send(data);
            } else {
                informFrontEndOfLog('Guard could not be delivered');
            }
        } else if (obj.type === 'dc') {
            informFrontEndOfLog('Disconnecting from remote machine');
            if (client != null) {
                client.close();
            }
            treatClientAsClosed();
        } else if (obj.type === 'sleep') {
            if (client != null && client.readyState === client.OPEN) {
                informFrontEndOfLog('Sending sleep');
                client.send(data);
                client.close();
                treatClientAsClosed();
            }
        }
    });
});

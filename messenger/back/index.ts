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
            state = 'online'
            informFrontEndOfStatus();
        });
        client.addEventListener('close', () => {
            state = 'offline'
            informFrontEndOfStatus();
        });
        client.addEventListener('error', () => {
            client = null;
            state = 'offline';
            informFrontEndOfStatus();
        });
    } else {
        client.send('ping');
    }
    informFrontEndOfStatus();
}

// Inform the frontend of the status of the SteamLink app
function informFrontEndOfStatus() {
    for (const front of server.clients) {
        const obj = {type: 'status', payload: state}
        front.send(JSON.stringify(obj));
    }
}

function loginRemoteMachine(user: string) {
    if (client && client.readyState === client.OPEN) {
        const account = config.accounts.find(account => account.user === user);
        const obj = {type: 'login', account};
        client.send(JSON.stringify(obj))
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
        newHtml = newHtml.replace('$url', config.websocketURL);
        res.send(newHtml);
    });
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});

// Running ws server
const server = new WebSocketServer({port: 15805, clientTracking: true});
server.on('connection', (ws) => {
    informFrontEndOfStatus();
    ws.on("message", (data: string) => {
        const obj = JSON.parse(data);
        console.log(obj);
        if (obj.type === 'login') {
            if (state !== 'online') {
                wol.wake(config.remoteMAC);
                setTimeout(() => loginRemoteMachine(obj.payload), 30000);
            } else {
                loginRemoteMachine(obj.payload);
            }
        }
    });
});

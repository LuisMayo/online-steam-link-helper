import express from 'express';
import fs from 'fs';
import { Config } from './config';

const app = express()
const port = 3000
let config: Config;
fs.readFile('./config.json', {encoding: 'utf8'}, (err, data) => {
    if (err != null) {
        console.error('Config file not found, please be sure to copy conf-dummy.json into conf.json and fill the details');
        process.exit(1);
    }
    config = JSON.parse(data);
});

app.get('/', (req, res) => {
    fs.readFile('./front/index.html', {encoding: 'utf8'}, (err, data) => {
        let buttons = '';
        for (const user of config.accounts) {
            buttons += `<button onclick="buttonClick">${user.user}</button>\n`;
        }
        let newHtml = data.replace('$buttons', buttons);
        newHtml = newHtml.replace('$url', 'ws://localhost');
        res.send(newHtml);
    });
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});
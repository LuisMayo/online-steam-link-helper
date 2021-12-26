import express from 'express';
import fs from 'fs';

const app = express()
const port = 3000

app.get('/', (req, res) => {
    fs.readFile('./front/index.html', {encoding: 'utf8'}, (err, data) => {
        let newHtml = data.replace('$buttons', '<button>aaa</button>');
        newHtml = newHtml.replace('$url', 'ws://localhost');
        res.send(newHtml);
    });
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});
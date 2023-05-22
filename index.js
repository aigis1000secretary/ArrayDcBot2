
require('dotenv').config();
const server = require('./server.js');

const fs = require('fs');
const sleep = (ms) => { return new Promise((resolve) => { setTimeout(resolve, ms); }); };



let clients = [];
module.exports.terminate = async () => {
    for (let client of clients) {
        client.emit('close');
    }
    // server.terminate();

    if (process.env.HOST_TYPE == 'HEROKU') { await rebootByHerokuAPI(); }

    process.exit(1);
};

(async () => {

    // defind host
    if (process.env.HOST_TYPE == 'HEROKU') { process.env.HOST_URL = 'https://arraydcbot.herokuapp.com'; }
    if (process.env.HOST_TYPE == 'FLY_IO') { process.env.HOST_URL = 'https://arraydcbot.fly.dev'; }
    if (process.env.HOST_TYPE == 'debug') { process.env.HOST_URL = 'https://2897-114-36-103-113.ngrok-free.app'; }

    // web server
    server.init();

    for (const bot of [
        'SSRB',
        // 'DICE'
    ]) {
        const configPath = `./configs/${bot}/`;


        if (fs.existsSync(`./bot.js`)) {
            let botJs = require(`./bot.js`);

            let client = await botJs.init(configPath);
            clients.push(client);
        }
    }






})();
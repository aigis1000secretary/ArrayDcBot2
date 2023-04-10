
require('dotenv').config();

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
    if (process.env.HOST_TYPE == 'debug') { process.env.HOST_URL = 'https://a363-122-116-50-201.ngrok.io'; }


    for (const bot of ['SSRB']) {
        const botPath = `./${bot}`;

        const botJs = `${botPath}/bot.js`;
        if (fs.existsSync(botJs)) { fs.unlinkSync(botJs); }

        const botPlugins = `${botPath}/plugins`;
        if (fs.existsSync(botPlugins)) { fs.rmdirSync(botPlugins, { recursive: true, force: true }); }

        fs.copyFileSync(`./BOT/bot.js`, botJs);
        fs.mkdirSync(botPlugins);
        for (const plugin of fs.readdirSync(`./BOT/plugins`)) {
            fs.copyFileSync(`./BOT/plugins/${plugin}`, `${botPlugins}/${plugin}`);
        }

        if (fs.existsSync(botJs)) {
            let bot = require(botJs)
            clients.push(await bot.init());
        }
    }






})();
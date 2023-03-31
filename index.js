require('dotenv').config();
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

    let bot = require('./SSRB/bot.js')
    clients.push(await bot.init());






})();
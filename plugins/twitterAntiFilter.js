
const fs = require('fs');
const path = require('path');
const canvas = require('canvas');
const ssim = require('image-ssim');
const compressing = require('compressing');
const request = require('request');
const { AttachmentBuilder } = require('discord.js');

const [EMOJI_LABEL] = ['🏷️']

function sleep(ms) { return new Promise((resolve) => { setTimeout(resolve, ms); }); }

// const { twitter } = require('./twitterListener2.js');
let blacklist = [];
let imagesList = [];

const dataPath = `./blacklist`;
const listPath = `./blacklist/blacklist.txt`;
const imagesPath = `./blacklist/images/`;

const readBlacklist = () => {
    // get username black list
    if (fs.existsSync(listPath)) {
        blacklist = [];
        const text = fs.readFileSync(listPath, 'utf8');
        for (let _line of text.split(/\r?\n/)) {
            let line = _line.trim();
            if (!!line && !blacklist.includes(line)) {
                blacklist.push(line);
            }
        }
    }

    // get image black list
    if (fs.existsSync(imagesPath)) {
        imagesList = [];
        const files = fs.readdirSync(imagesPath);
        for (let _file of files) {
            let file = `${imagesPath}${_file}`;
            if (!imagesList.includes(file)) {
                imagesList.push(file);
            }
        }
    }
}

let client = null;
const downloadBlacklist = async () => {
    if (!client) { return; }
    if (fs.existsSync(dataPath)) {
        fs.rmdirSync(dataPath, { recursive: true, force: true });
    }

    // get channel/message by id
    let channel = await client.channels.fetch(`872122458545725451`).catch(() => { return null; });
    if (!channel) { return; }
    const msg = await channel.messages.fetch({ message: `1055852678913196042`, force: true }).catch(() => { return null; });
    if (!msg) { return; }

    // download black list files
    for (const [key, value] of msg.attachments) {
        const { name, url } = value;
        const filename = `./${name}`;
        await new Promise((resolve) => { request(url).pipe(fs.createWriteStream(filename)).on('close', resolve); });
        await compressing.zip.uncompress(filename, './').catch(() => { });
        if (fs.existsSync(filename)) { fs.unlinkSync(filename); }
    }

    // call other module
    channel = await client.channels.fetch(`826992877925171250`).catch(() => { return null; });
    if (!channel) { return; }
    await channel.send({ content: '!regexanti' })
        .then((msg) => { msg.delete().catch(() => { }) })
        .catch(() => { });
}
const uploadBlacklist = async (content = null) => {
    if (!client || !fs.existsSync(dataPath)) { return; }

    // update blacklist
    if (fs.existsSync(listPath)) { fs.unlinkSync(listPath); }
    fs.writeFileSync(listPath, blacklist.join('\r\n'), 'utf8');

    // get channel/message by id
    const channel = await client.channels.fetch(`872122458545725451`).catch(() => { return null; });
    if (!channel) { return; }
    const msg = await channel.messages.fetch({ message: `1055852678913196042`, force: true }).catch(() => { return null; });
    if (!msg) { return; }

    // zip black list files
    const filePath = `${dataPath}.zip`;
    await compressing.zip.compressDir(dataPath, filePath).catch(() => { });
    const nowDate = (new Date(Date.now()).toLocaleString('en-ZA', { timeZone: 'Asia/Taipei' }))
        .replace(/[\/:]/g, '').replace(', ', '_');

    const attachment = new AttachmentBuilder(filePath, { name: `${nowDate}.zip` });
    // upload zip file
    await msg.edit({ content: ' ', files: [attachment] }).catch(() => { });
    if (fs.existsSync(filePath)) { fs.unlinkSync(filePath); }

    // call other module
    await channel.send({ content: '!regexanti' })
        .then((msg) => { msg.delete().catch(() => { }) })
        .catch(() => { });
    if (content) { await channel.send({ content }).catch(() => { }); }
}

const toCompressData = (image, imgWidth = 8) => {
    const mainCanvas = canvas.createCanvas(imgWidth, imgWidth);
    const ctx = mainCanvas.getContext('2d');
    ctx.drawImage(image, 0, 0, imgWidth, imgWidth);
    return ctx.getImageData(0, 0, imgWidth, imgWidth);;
};

const imageComparison = async (url) => {
    const [, filename, ext] = url.match(/\/([^\/]*)\.([^\/\.]*)$/);
    const file1 = `./${filename}_${process.uptime().toString().replace('.', '')}.${ext}`;
    if (!fs.existsSync(file1)) await new Promise((resolve) => { request(url).pipe(fs.createWriteStream(file1)).on('close', resolve); });
    await sleep(500);
    if (!fs.existsSync(file1)) { return false; }

    // SSIM check
    // get twitter image
    let image1 = await canvas.loadImage(file1).catch((e) => { console.log(url); console.log(file1, e.message); throw null; });
    image1 = toCompressData(image1, 8);
    image1.channels = 4;
    // del twitter image
    if (fs.existsSync(file1)) { fs.unlinkSync(file1); }

    // get all blacklist images
    for (let file2 of imagesList) {
        let image2 = await canvas.loadImage(file2).catch((e) => { console.log(url); console.log(file2, e.message); return false; });
        if (!image2) { continue; }
        image2 = toCompressData(image2, 8);
        image2.channels = 4;

        // get ssim result
        let result = ssim.compare(image1, image2);
        if (result.ssim < 0.95) { continue; }   // different image

        return { ssim: result.ssim, image: file2 };
    }
    return false;
}

module.exports = {
    name: 'twitterAntiFilter',
    description: "twitterAntiFilter",

    async setup(_client) {
        if (_client.user.id != `920485085935984641`) { return; }
        client = _client
        // await uploadBlacklist();
        await downloadBlacklist();
        readBlacklist();
    },

    async messageReactionAdd(reaction, user, pluginConfig) {

        if (user.bot) { return false; }
        if (user.id != `353625493876113440`) { return; }

        // get msg data
        const { message } = reaction;
        const { client, content, embeds } = message;

        // skip other emoji
        if (reaction.emoji.toString() != EMOJI_LABEL) { return; }

        // is twitter url or not
        if (!/https?:\/\/twitter\.com\/([^\/]*)\/status\/(\d*)/i.test(content)) { return; }

        // get tweet data
        const [, username, tweetID] = (content.match(/https?:\/\/twitter\.com\/([^\/]*)\/status\/(\d*)/) || [, null, null]);
        // get image data
        const image = (((embeds || [])[0]) || {}).image || null;

        // check tweet data
        if (username == null || tweetID == null) { return; }

        let resultLog = [];

        // set username to blacklist
        if (!blacklist.includes(username)) {
            blacklist.push(username);
            resultLog.push(`[+] ${username}`);
        }

        // get twitter image
        if (image) {
            // get image url
            const url = image.proxyURL || image.url;

            // check image in blacklist or not
            let imageInBlackList = await imageComparison(url).catch((e) => { return null });
            if (!imageInBlackList) {
                // get image data
                const [, ext] = url.match(/([^\.]+)$/) || [, null];
                const filename = `${username}-${tweetID}-img1.${ext}`;
                const filepath = `./blacklist/images/${filename}`;
                // download image to blacklist
                if (!imagesList.includes(filepath)) {
                    imagesList.push(filepath);
                    resultLog.push(`[+] ${filename}`);
                    await new Promise((resolve) => { request(url).pipe(fs.createWriteStream(filepath)).on('close', resolve); });
                }
            }
        }

        if (resultLog.length > 0) { uploadBlacklist(resultLog.join('\n')); }
        // message.delete().catch(() => { });
    },

    async execute(message, pluginConfig, command, args, lines) {

        // wait discord embeds
        await sleep(2000);
        message = await message.channel.messages.fetch({ message: message.id, force: true }).catch(() => { return null; });
        if (!message) { return false; }

        const { client: _client, embeds } = message;
        const content = `${message.content}`;

        // twitter url
        if (/https?:\/\/twitter\.com/i.test(content)) {
            const image = (((embeds || [])[0]) || {}).image || null;
            if (!image) { return; } // no image

            // download image
            const url = image.proxyURL || image.url;
            let imageInBlackList = await imageComparison(url).catch((e) => { return e });
            if (imageInBlackList) {
                // get username
                const [, username, tweetID] = (content.match(/https?:\/\/twitter\.com\/([^\/]*)\/status\/(\d*)/) || [, null, null]);
                console.log(imageInBlackList.ssim, username, tweetID, imageInBlackList.image);

                message.delete().catch(() => { });

                if (username && !blacklist.includes(username)) {
                    blacklist.push(username);
                    uploadBlacklist(`[+] ${username}`);
                    return;
                }

                await sleep(5000);
                message.channel.send({ content: content });
            }
        }

        if (message.author?.id != `353625493876113440`) { return; }
        if (_client.user.id != `920485085935984641`) { return; }

        if ('rembl' == command) {

            let log = [];
            for (let target of args) {
                if (blacklist.includes(target)) {
                    blacklist.splice(blacklist.indexOf(target), 1);
                    log.push(`[-] ${target}`);
                }
            }
            uploadBlacklist(log.join('\n'));
            return;
        }
        if ('remimg' == command) {

            let log = [];
            for (let target of args) {
                if (!/\d+/.test(target)) { continue; }
                target = imagesList.find((img => img.includes(target)));

                if (target) {
                    imagesList.splice(imagesList.indexOf(target), 1);
                    if (fs.existsSync(target)) { fs.unlinkSync(target); }
                    log.push(`[-] ${target}`);
                }
            }
            uploadBlacklist(log.join('\n'));
            return;
        }

        if ('uploadbl' == command) {
            uploadBlacklist(`upload`);
        }
        if ('reloadbl' == command) {
            await downloadBlacklist();
            readBlacklist();
        }

        if ('delall' == command) {
            const { channel } = message;
            // if (!/https:\/\/twitter\.com/i.test(content)) { return false; }
            if (!['1054284227375542333', '713623232070156309'].includes(channel.id)) { return false; }    // #SAO

            let delcount = 0, before = null;
            while (1) {
                let msgs = await channel.messages.fetch(before ? { before } : {}).catch(() => { return null; });
                if (!msgs) { break; }

                let bulkDel = [];
                for (let key of msgs.keys()) {
                    let msg = msgs.get(key);
                    before = msg.id;

                    if (!msg.author || msg.author.id != _client.user.id) { continue; }

                    // await msg.delete().then(msg => console.log(`Del msg: ${msg.content}`)).catch(() => { });
                    // await msg.delete().catch(() => { });
                    if (!bulkDel.includes(msg)) { bulkDel.push(msg) };

                    ++delcount;
                }
                await channel.bulkDelete(bulkDel).catch(console.error);
                if (msgs.size != 50) { break; }
            }
            console.log(`Bulk deleted ${delcount} messages in ${channel.name}`)
            message.delete().catch(() => { });
            return;
        }
    },


    // TODO
    // command?


    // // get config
    // if (command) {
    //     switch (command) {
    //         case '': {

    //         } break;
    //         default: {

    //         } break;
    //     }
    // }






















    // // get config
    // const { channel, author } = message;
    // if (!author || !embeds) { return false; }
    // if (!/https:\/\/twitter\.com/i.test(content)) { return false; }
    // if (!['1054284227375542333'].includes(channel.id)) { return false; }

    // // get tweet from discord embed
    // let description = (((embeds || [])[0]) || {}).description || '';

    // (() => {
    //     let isAnti = false;
    //     // hashtag > 3
    //     isAnti |= ((description.match(/#/g) || []).length > 3);
    //     // // check twitter profile by api
    //     // if (isAnti) {
    //     //     let [, username] = (content.match(/https:\/\/twitter\.com\/([^\/]+)/i) || []);
    //     //     let user = await twitter.getUserByUsername(username, { 'user.fields': ['description'] });
    //     //     isAnti |= user.data?.description?.includes('kis_kirrrrrr');
    //     //     isAnti |= user.data?.name?.includes('如月キ');
    //     // }
    //     // keywords > 3
    //     let keywords = ['敗退', '戦犯', '夢見症候群', '放射能', '死ね', '殺す', '日本猿', '負け', '如月']
    //     let keywordsRegex = new RegExp(`(${keywords.join(')|(')})`, 'g');
    //     isAnti |= ((description.match(keywordsRegex) || []).length > 3);

    //     if (!isAnti) { return true; }
    //     // keep data
    //     channel.send({ content: content.replace('https', 'http') });
    // })();

    // // delete auto retweet
    // if (client.user.id != author.id) { return true; }
    // await message.delete().catch(console.log);
}


const express = require('express');
const app = require('../server.js').app;

// html serve index (only for get)
const serveIndex = require('serve-index');
app.get(/^\/blacklist(\/[^\/]*)*$/, express.static('.'), serveIndex('.', {
    'icons': true, stylesheet: './style.css', view: 'details'
}));

// webdav
const fullPath = path.resolve(`./blacklist`);
const webdav = require('webdav-server').v2;
const server = new webdav.WebDAVServer();
server.setFileSystem('/', new webdav.PhysicalFileSystem(fullPath));
app.use(webdav.extensions.express('/blacklist/', server)); // GET 以外
//*/


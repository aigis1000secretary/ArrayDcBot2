
// node base
const fs = require('fs');
const debug = fs.existsSync("./.env");

let mclog = debug ? console.log : () => { };
const sleep = (ms) => { return new Promise(resolve => setTimeout(resolve, ms)); };

// discord
const { EmbedBuilder, PermissionFlagsBits, Colors } = require('discord.js');

// http request
const request = require('request');
const util = require('util');
const get = util.promisify(request.get);
const post = util.promisify(request.post);

// discord webhook
const redirectUri = process.env.HOST_URL;
// API endpoint
const API_ENDPOINT = 'https://discord.com/api';

// config
const regUrl = /((?:https?:)?\/\/)?((?:www\.|m\.)?youtube\.com|youtu\.be|holodex\.net)(\/(?:embed|live|v|attribution_link)(?:\?(?:[\w\-]+=[\w\-]*&?)*)?)?(\/(?:watch(?:\?(?:[\w\-]+=[\w\-]*&)*v=|\/)|v[=\/])?)([\w\-]+)/;

// database api
const { Pool } = require('pg');
const pgConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: false,
};
const pool = new Pool(pgConfig);
pool.connect().then(p => { p.end(); }).catch(console.error); // test connect
const memberTime = 1000 * 60 * 60 * 24 * 35;    // 1000 ms  *  60 sec  *  60 min  *  24 hr  *  35 days
const memberTemp = 1000 * 60 * 60 * 24;         // 1000 ms  *  60 sec  *  60 min  *  24 hr

const coreArray = [];

class pg {
    expiresKey = '';
    constructor(config = {}) { this.init(config); };
    init({ expiresKey }) {
        this.expiresKey = expiresKey;
    };

    // table api
    async listTable() {
        const sql = `SELECT * FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';`;
        const res = await pool.query(sql).catch((error) => { console.log(error.message) });
        return res ? res.rows : null;
    };
    async checkTable() {
        const sql = `SELECT * FROM pg_catalog.pg_tables WHERE tablename='user_connections';`
        const res = await pool.query(sql).catch((error) => { console.log(error.message) });
        return ((res && res.rows.length > 0) ? res.rows : null);
    };
    async creatTable() {
        const sql = [
            `CREATE TABLE user_connections (`,
            `discord_id char(19) PRIMARY KEY,`,
            `youtube_id char(24) NOT NULL,`,
            `${this.expiresKey} bigint NOT NULL DEFAULT 0`,
            `);`
        ].join(' ');
        const res = await pool.query(sql).catch((error) => { console.log(error.message) });
        return res ? res.rows : null;
    };
    async checkColumn() {
        const sql = `SELECT ${this.expiresKey} FROM user_connections;`
        const res = await pool.query(sql).catch((error) => { console.log(error.message) });
        return res ? res.rows : null;
    };
    async creatColumn() {
        const sql = `ALTER TABLE user_connections ADD COLUMN ${this.expiresKey} bigint NOT NULL DEFAULT 0;`
        const res = await pool.query(sql).catch((error) => { console.log(error.message) });
        return res ? res.rows : null;
    };

    // data api
    async listUserID() {
        const sql = `SELECT discord_id FROM user_connections;`
        const res = await pool.query(sql).catch((error) => { console.log(error.message) });
        if (res) { for (let row of res.rows) { row.discord_id = row.discord_id.trim(); } }
        return res ? res.rows : null;
    };
    async listUserData() {
        const sql = `SELECT * FROM user_connections;`
        const res = await pool.query(sql).catch((error) => { console.log(error.message) });
        if (res) { for (let row of res.rows) { row.discord_id = row.discord_id.trim(); } }
        return res ? res.rows : [];
    };
    async listExpiresUserID(expires = Date.now()) {
        const sql = [
            `SELECT (discord_id) FROM user_connections`,
            `WHERE ${this.expiresKey}<=${expires}`,
            `AND ${this.expiresKey}>0;`
        ].join(' ');
        const res = await pool.query(sql).catch((error) => { console.log(error.message) });
        if (res) { for (let row of res.rows) { row.discord_id = row.discord_id.trim(); } }
        return res ? res.rows : [];
    };
    async getDataByDiscordID(discordID) {
        const sql = [
            `SELECT * FROM user_connections`,
            `WHERE discord_id='${discordID}';`
        ].join(' ');
        const res = await pool.query(sql).catch((error) => { console.log(error.message) });
        if (res) { for (let row of res.rows) { row.discord_id = row.discord_id.trim(); } }
        return res ? res.rows[0] : null;
    };
    async getDataByYoutubeID(youtubeID) {
        const sql = [
            `SELECT * FROM user_connections`,
            `WHERE youtube_id='${youtubeID}';`
        ].join(' ');
        const res = await pool.query(sql).catch((error) => { console.log(error.message) });
        if (res) { for (let row of res.rows) { row.discord_id = row.discord_id.trim(); } }
        return res ? res.rows[0] : null;
    };
    async insertData(discordID, youtubeID) {
        // duplicate key value violates unique 
        let data = await this.getDataByDiscordID(discordID);
        if (data) {
            // found old data
            if (data[this.expiresKey] == 0) {
                await this.updateExpires(discordID, (Date.now() + memberTemp));
            }
            // return await this.getDataByDiscordID(discordID);
            return true;
        }

        // insert data
        const sql = [
            `INSERT INTO user_connections (discord_id, youtube_id, ${this.expiresKey})`,
            `VALUES ('${discordID}', '${youtubeID}', ${Date.now() + memberTemp});`
        ].join(' ');
        const res = await pool.query(sql).catch((error) => { console.log(error.message) });
        return res ? res : null;
    };
    async deleteData(discordID) {
        // delete data
        const sql = [
            `DELETE FROM user_connections`,
            `WHERE discord_id='${discordID};'`
        ].join(' ');

        const res = await pool.query(sql).catch((error) => { console.log(error.message) });
        return res ? res : null;
    };
    async updateYoutubeID(discordID, youtubeID) {
        if (!await this.getDataByDiscordID(discordID)) { return null; }
        // insert data
        const sql = [
            `UPDATE user_connections`,
            `SET youtube_id='${youtubeID}'`,
            `WHERE discord_id='${discordID}';`
        ].join(' ');
        const res = await pool.query(sql).catch((error) => { console.log(error.message) });
        return res ? res : null;
    };
    async updateExpires(discordID, expires = (Date.now() + memberTime)) {
        if (!await this.getDataByDiscordID(discordID)) { return null; }
        // insert data
        const sql = [
            `UPDATE user_connections`,
            `SET ${this.expiresKey}=${expires}`,
            `WHERE discord_id='${discordID}';`
        ].join(' ');
        const res = await pool.query(sql).catch((error) => { console.log(error.message) });
        return res ? res : null;
    };
}
class youtube {
    holoChannelID = 'holoChannelID';
    apiKey = [];
    quotaExceeded = [false, false];
    constructor(config = {}) { this.init(config); };
    init({ holoChannelID, apiKey }) {
        this.holoChannelID = holoChannelID;
        this.apiKey = apiKey;
    };

    // youtube api
    async getVideoSearch({ channelId = this.holoChannelID, eventType, order, publishedAfter } = {}) {
        mclog(`youtube.getVideoSearch( ${channelId}, ${eventType} )`);
        if (this.quotaExceeded[0]) {
            return {
                code: 403, message: 'quotaExceeded', reason: 'quotaExceeded',
                variabale: { channelId, eventType, order, publishedAfter }
            };
        }

        try {
            const url = 'https://www.googleapis.com/youtube/v3/search';
            const params = {
                part: 'id,snippet', channelId,
                eventType, order, publishedAfter,
                maxResults: 5, type: "video",
                key: this.apiKey[0]
            }
            const res = await get({ url, qs: params, json: true }); // response

            // throw error
            if (res.statusCode != 200 || (res.body && res.body.error)) {
                if (res.statusCode == 404) {
                    throw {
                        code: 404, message: 'Error 404 (Not Found)!!',
                        errors: [{
                            message: 'Error 404 (Not Found)!!',
                            domain: 'global', reason: 'Not Found'
                        }],
                    };
                }
                else if (res.body) { throw res.body.error ? res.body.error : res.body; }
                else throw res;
            }

            // get response data
            const data = res.body;
            return data.items;
            // return [
            //     {
            //         kind: 'youtube#searchResult', etag: '07WUPWqVpujODorWqJyH8Zs29PI',
            //         id: { kind: 'youtube#video', videoId: '3gH2la1zZ3A' },
            //         snippet: {
            //             publishedAt: '2022-08-17T00:46:24Z', publishTime: '2022-08-17T00:46:24Z',
            //             channelId: 'UCc88OV45ICgHbn3ZqLLb52w', channelTitle: 'Fuma Ch. 夜十神封魔 - UPROAR!! -',
            //             title: '#8【ドラゴンクエストXI S】最後の旅・・・。【#夜十神封魔/#ホロスターズ/#アップロー】※ネタバレあり',
            //             description: 'ドラゴンクエスト11s 本動画のゲームプレイ映像は、株式会社スクウェア・エニックスの許諾を受けて使用しています。 この動画 ...',
            //             liveBroadcastContent: 'upcoming', thumbnails: [Object]
            //         }
            //     }
            // ]

        } catch (error) {
            // unknown error
            if (!Array.isArray(error.errors) || !error.errors[0]) {
                console.log(error);
                // return { code: error.code || null, error };
                return [];
            }

            if (error.code == 403 && error.errors[0].reason == 'quotaExceeded') {
                this.quotaExceeded[0] = true;
            }
            console.log(`youtube.getVideoSearch ${error.errors[0].reason}`);
            // return {
            //     code: error.code,
            //     message: error.message,
            //     reason: error.errors[0].reason,
            //     variabale: { channelId, eventType, order, publishedAfter }
            // }
            return [];
        }
    };
    async getVideoStatus(vID) {
        mclog(`youtube.getVideoStatus( ${vID} )`);
        if (this.quotaExceeded[0]) {
            // return {
            //     code: 403, message: 'quotaExceeded', reason: 'quotaExceeded',
            //     variabale: { vID }
            // };
            return null;
        }

        try {
            const url = 'https://www.googleapis.com/youtube/v3/videos';
            const params = {
                part: 'id,snippet,liveStreamingDetails',
                id: vID,
                key: this.apiKey[0]
            }
            const res = await get({ url, qs: params, json: true });

            // throw error
            if (res.statusCode != 200 || (res.body && res.body.error)) {
                if (res.statusCode == 404) {
                    throw {
                        code: 404, message: 'Error 404 (Not Found)!!',
                        errors: [{
                            message: 'Error 404 (Not Found)!!',
                            domain: 'global', reason: 'Not Found'
                        }],
                    };
                }
                else if (res.body) { throw res.body.error ? res.body.error : res.body; }
                else throw res;
            }

            // get response data
            const data = res.body;
            if (data.pageInfo.totalResults == 0) {
                console.log('[MC] video not found.');
                // return {
                //     code: 200, message: 'video not found', reason: 'video not found',
                //     variabale: { vID }
                // };
                return null;
            }
            return data.items[0];
            // return {
            //     id: '3gH2la1zZ3A', kind: 'youtube#video', etag: 'ktzgCNL-70YVg2aP-FcihaZ_vKA',
            //     snippet: {
            //         publishedAt: '2022-08-17T00:46:24Z', channelId: 'UCc88OV45ICgHbn3ZqLLb52w',
            //         title: '#8【ドラゴンクエストXI S】最後の旅・・・。【#夜十神封魔/#ホロスターズ/#アップロー】※ネタバレあり',
            //         description: '#ドラゴンクエスト11s\n #ゲーム実況',
            //         thumbnails: { default: [Object], medium: [Object], high: [Object], standard: [Object], maxres: [Object] },
            //         channelTitle: 'Fuma Ch. 夜十神封魔 - UPROAR!! -',
            //         categoryId: '20',
            //         liveBroadcastContent: 'upcoming',
            //         localized: {
            //             title: '#8【ドラゴンクエストXI S】最後の旅・・・。【#夜十神封魔/#ホロスターズ/#アップロー】※ネタバレあり',
            //             description: '#ドラゴンクエスト11s\n #ゲーム実況'
            //         }
            //     },
            //     liveStreamingDetails: {
            //         scheduledStartTime: '2022-08-17T01:30:00Z',
            //         activeLiveChatId: 'Cg0KCzNnSDJsYTF6WjNBKicKGFVDYzg4T1Y0NUlDZ0hibjNacUxMYjUydxILM2dIMmxhMXpaM0E'
            //     }
            // }

        } catch (error) {
            // unknown error
            if (!Array.isArray(error.errors) || !error.errors[0]) {
                console.log(error);
                // return { code: error.code || null, error };
                return null;
            }

            if (error.code == 403 && error.errors[0].reason == 'quotaExceeded') {
                this.quotaExceeded[0] = true;
            }
            console.log(`youtube.getVideoStatus ${error.errors[0].reason}`);
            // return {
            //     code: error.code,
            //     message: error.message,
            //     reason: error.errors[0].reason,
            //     variabale: { vID }
            // }
            return null;
        }
    };
}

class streamVideo {
    video; filepath; indexOfLine; status;
    constructor({ video, filepath, indexOfLine, status }) {
        this.video = video || null;
        this.filepath = filepath || null;
        this.indexOfLine = indexOfLine || null;
        this.status = status || null;
    }
}

class memberCheckerCore {
    cacheStreamList = new Map();
    cacheMemberList = [];

    // interface
    pg = new pg();
    youtube = new youtube();

    // setting
    // client object
    client = null;


    // config
    expiresKey;
    guild; memberRole;
    logChannelID; startTagChannelID;
    streamChannelID; memberChannelID;
    botID; clientSecret;
    dcPushEmbed = () => { };

    constructor(_client, config, guild, role) {
        // interface
        this.pg.init(config);
        this.youtube.init(config);
        // client object
        this.client = _client;
        // config
        this.expiresKey = config.expiresKey;
        this.guild = guild;
        this.memberRole = role;
        this.logChannelID = config.logChannelID;
        this.startTagChannelID = config.startTagChannelID;
        this.streamChannelID = config.streamChannelID;
        this.memberChannelID = config.memberChannelID;
        this.botID = _client.user.id;
        this.clientSecret = _client.mainConfig.clientSecret;

        _client.channels.fetch(config.logChannelID).then((channel) => {
            if (channel) {
                this.dcPushEmbed = (embed) => { return channel.send({ embeds: [embed] }).catch(console.log); };
            } else {
                this.dcPushEmbed = (embed) => { console.log(embed.description || embed.data.description); };
            }
        });
    };

    // timer
    interval = null;
    clockMethod = async (now) => {
        // check stream task list at XX:03:00
        let nowDate = new Date(now);
        if (![3, 4, 5, 7, 9, 11].includes(nowDate.getHours()) &&
            nowDate.getMinutes() == 3 &&
            nowDate.getSeconds() == 0) {
            this.cacheStreamLists();
        }
    }

    async coreInit() {
        await sleep(5000);

        // check table
        if (!await this.pg.checkTable()) {
            console.log(`init user_connections database!`);
            await this.pg.creatTable();
        }
        if (!await this.pg.checkColumn()) {
            console.log(`init column <${this.pg.expiresKey}>!`);
            await this.pg.creatColumn();
        }

        // check expires user
        await this.checkExpiresUser();

        // clock
        const timeoutMethod = () => {
            const now = Date.now();
            // check every 1sec (time offset = 1.5 sec - (time in Milliseconds % 1sec))
            this.interval = setTimeout(timeoutMethod, 500 - now % 1000 + 1000);

            this.clockMethod(now);
        }
        this.interval = setTimeout(timeoutMethod, 2000);
        this.client.once('close', () => {
            clearTimeout(this.interval);
        });
    }

    get301Url() {
        let url = `${redirectUri}/member/${this.botID}/${this.expiresKey}`;
        return url;
    }
    getAuthorizeUrl() {
        let url = `https://discord.com/api/oauth2/authorize?`
            + `client_id=${this.botID}&`
            + `state=${this.botID}${this.expiresKey}&`
            + `redirect_uri=${encodeURIComponent(redirectUri + "/callback")}&`
            + `response_type=code&`
            + `scope=identify%20connections`;
        return url;
    }


    // main logic
    // check user role / membership expires
    async checkExpiresUser() {
        mclog('core.checkExpiresUser');
        let data = [];

        // => del user role/del db data
        // sync run
        data = await this.pg.listExpiresUserID();
        mclog(`core.pg.listExpiresUserID`);

        // get discord users cache
        await this.guild.members.fetch({ force: true }).catch(console.log);
        // get expires user
        for (let _user of data) {
            let dID = _user.discord_id;

            // get user data in guild
            let user = this.guild.members.cache.get(dID);
            if (!user) {
                mclog(`User <@${dID}> not in guild <${this.guild}>`);
                continue;
            }

            // check user level
            let isSpecalUser = user.roles.cache.has(this.memberRole.id);

            // set user role
            if (isSpecalUser) {
                mclog(`found dc user, Disable role! : ${dID}`);
                this.dcPushEmbed(new EmbedBuilder().setColor(Colors.Red).setDescription(`認證過期, 刪除身分組(${this.memberRole}): ${user.user.tag} ${user.toString()}`));
                this.pg.updateExpires(dID, 0);
                user.roles.remove(this.memberRole).catch(console.log);
            } else {
                mclog(`found dc user, Delete apply! : ${dID}`);
                this.dcPushEmbed(new EmbedBuilder().setColor(Colors.Orange).setDescription(`申請過期, 清除申請: ${user.user.tag} ${user.toString()}`));
                this.pg.updateExpires(dID, 0);
            }
        }


        // set role again
        data = await this.pg.listUserData();
        mclog(`core.pg.listUserData`);

        // get users
        for (let _user of data) {
            let dID = _user.discord_id;
            let expires = _user[this.expiresKey];
            if (expires == 0) { continue; }

            // get user data in guild
            let user = this.guild.members.cache.get(dID);
            if (!user) {
                // mclog(`User <@${dID}> not in guild <${this.guild}>`);
                continue;
            }

            // check user level
            let isSpecalUser = user.roles.cache.has(this.memberRole.id);

            // set user role
            if (isSpecalUser) {
                // mclog(`found dc user with member role! : ${dID}`);
            } else if (expires > Date.now() + memberTemp) {
                mclog(`found dc user, add role! : ${dID}`);
                this.dcPushEmbed(new EmbedBuilder().setColor(Colors.Blue).setDescription(`確認期限, 恢復身分組(${this.memberRole}): ${user.user.tag} ${user.toString()}`));
                user.roles.add(this.memberRole).catch(console.log);
            }
        }
    }
    // get streams list
    async cacheStreamLists() {
        mclog('core.cacheStreamLists');
        // // clear cache
        // this.cacheStreamList = {};

        // // search videos in last day
        // let date = (new Date(Date.now() - 1000 * 60 * 60 * 24)).setHours(3, 0, 0, 0);   // last day 03:00
        // let lives = await this.youtube.getVideoSearch({ order: 'date', publishedAfter: date.toISOString() });

        // search videos in last day
        let videos = await this.youtube.getVideoSearch({ eventType: "live" });
        let upcoming = await this.youtube.getVideoSearch({ eventType: "upcoming" })
        for (let newVideo of upcoming) {
            if (!videos.find((video) => video.id.videoId == newVideo.id.videoId)) {
                videos.push(newVideo);
            }
        }

        // ready to show search result
        sleep(1000).then(() => {
            mclog(`now time:`, new Date(Date.now()).toLocaleString('en-ZA', { timeZone: 'Asia/Taipei' }));
        });
        // check search result
        for (let video of videos) {
            // get vID
            let vID = video.id.videoId;
            // video in cache
            if (this.cacheStreamList.has(vID)) { continue; }

            // get REALLY video data
            let videoStatus = await this.getVideoStatus(vID);
            if (videoStatus == null) { break; } // API fail

            // check result status AGAIN
            let status = videoStatus.snippet.liveBroadcastContent;
            let startTime = videoStatus.liveStreamingDetails.scheduledStartTime;
            // show result
            sleep(1000).then(() => {
                mclog(`stream at`, new Date(Date.parse(startTime)).toLocaleString('en-ZA', { timeZone: 'Asia/Taipei' }), vID, status.padStart(8, ' '), videoStatus.snippet.title);
            });

            if (!['upcoming', 'live'].includes(status)) { continue; }
            this.cacheStreamList.set(vID, new streamVideo({ video: videoStatus, status: 'waiting' }));
        }
    }

    // command
    async cmdExpiredUser() {
        // get expires data
        let data = await this.pg.listUserData();
        let expiresKey = this.expiresKey;
        let response = [];

        // sort
        data.sort((a, b) => a[expiresKey] == b[expiresKey] ? 0 : (a[expiresKey] > b[expiresKey] ? 1 : -1));
        // set log
        for (let user of data) {
            let { discord_id, youtube_id } = user;
            let expires = parseInt(user[expiresKey]);
            if (expires == 0) { continue; }

            let t = (expires - Date.now()) / (1000 * 60 * 60);
            let timeLeft = `${parseInt(t / 24).toString().padStart(3, ' ')}days ${parseInt(t % 24).toString().padStart(2, ' ')}hours`;
            let dateLimit = new Date(expires).toLocaleString('en-ZA', { timeZone: 'Asia/Taipei' }).padStart(23, ' ');

            mclog(discord_id, youtube_id, timeLeft, dateLimit, expires);
            if (t < (memberTemp / (1000 * 60 * 60))) {
                response.push(`<@${discord_id}> ${youtube_id}\n${timeLeft} ${dateLimit}`);
            }
        }

        return response;
    }
    cmdStreamList() {
        let streamList = [];

        for (let vID of this.cacheStreamList.keys()) {
            // get cache
            let video = this.cacheStreamList.get(vID).video;
            mclog(`[MC] ${vID} ${video ? 'Object' : video}`);
            if (!video) { continue; }

            // get video data
            let description = video ? video.snippet.title : vID;
            streamList.push(`[${description}](http://youtu.be/${vID})`);
        }

        return ['直播台:'].concat(streamList);
    }
}






module.exports = {
    name: 'member checker',
    description: "check who is SSRB",

    async execute(message, pluginConfig, command, args, lines) {

        if (!command) { return false; }

        const { client, channel } = message;

        // check core
        let cores = coreArray.filter((core) => { return (core.botID == client.user.id && core.guild.id == message.guild.id); });
        if (cores.length <= 0) { return false; }

        for (let core of cores) {
            const isLogChannel = (channel.id == core.logChannelID);

            if (isLogChannel && command == 'mcdebug') {
                mclog = (mclog == console.log) ?
                    (() => { }) : console.log;
                continue;
            }
            if (isLogChannel && command == 'user') {
                let dID = args[0];
                if (!dID) {
                    channel.send({ content: `!user <user discord ID>` });
                    continue;
                }

                let data = await core.pg.getDataByDiscordID(dID.trim());
                console.log(data)

                channel.send({ content: `${dID}\n${JSON.stringify(data, null, 2)}` });
                continue;
            }
            if (isLogChannel && command == 'database') {
                // get response
                let response = await core.cmdExpiredUser();

                // log to console
                for (let res of response) { console.log(res); }

                // log to channel
                if (response.length > 0) {
                    let embeds = [new EmbedBuilder().setDescription(response.join('\n'))];
                    channel.send({ embeds });
                }
                continue;
            }
            if (command == 'member') {
                channel.send({ content: core.get301Url() });
                continue;
            }
            if (command == 'stream') {
                // force update all stream list cache by admin

                if (regUrl.test(args[0])) {
                    // get vID
                    const [, , , , , vID] = args[0].match(regUrl);

                    // get video data from API
                    let video = await core.youtube.getVideoStatus(vID)
                    // update cache data
                    if (video && video.snippet && video.snippet.channelId == core.youtube.holoChannelID) {
                        core.cacheStreamList[vID] = video;
                        core.dcPushEmbed(new EmbedBuilder().setColor(Colors.DarkGold).setDescription(`手動新增直播清單`));
                    }
                } else if (isLogChannel) {
                    await core.cacheStreamLists();
                    core.dcPushEmbed(new EmbedBuilder().setColor(Colors.DarkGold).setDescription(`更新直播清單`));
                }

                // get response
                let streamList = core.cmdStreamList();

                let embed = new EmbedBuilder().setColor(Colors.DarkGold);
                if (streamList.length <= 0) { embed.setDescription(`目前沒有直播台/待機台`); }
                else { embed.setDescription(streamList.join('\n')); }
                channel.send({ embeds: [embed] });

                continue;
            }
        }

        return true;
    },

    async setup(client) {
        // get guild list if bot working space
        for (let gID of client.guildConfigs.keys()) {

            const pluginConfig = client.getPluginConfig(gID, `memberChecker3`);
            if (!pluginConfig) { continue; }

            // get config list for guild with gID
            for (let mcConfig of pluginConfig) {

                // get guild object
                const guild = client.guilds.cache.get(gID);
                if (!guild) { continue; }    // bot not in guild
                if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) { console.log(`Missing Permissions: MANAGE_ROLES in <${gID}>`); continue; }
                if (!guild.members.me.permissions.has(PermissionFlagsBits.SendMessages)) { console.log(`Missing Permissions: SEND_MESSAGES in <${gID}>`); continue; }

                // check role
                const role = guild.roles.cache.get(mcConfig.memberRoleID);
                if (!role) { console.log(`Missing Role: <@&${mcConfig.memberRoleID}> in <${gID}>`); continue; }    // cant found role

                let newCore = new memberCheckerCore(client, mcConfig, guild, role);
                newCore.coreInit();
                coreArray.push(newCore);
            }
        }

    }
}













// express
const app = require('../server.js').app;
app.all(`/member/:botid/:ekey`, async (req, res) => {
    let botID = req.params.botid;
    let expiresKey = req.params.ekey;

    // get core form botid
    let core = coreArray.find((core) => { return (core.botID == botID && core.expiresKey == expiresKey); });
    if (!core) {
        res.send(`不明的參數組! 請聯絡管理員或製作者\n${botID}, ${expiresKey}`);
        return;
    }

    res.redirect(301, core.getAuthorizeUrl());
    return;
});
app.all('/callback', async (req, res) => {
    const param = req.query.state || '';
    const [, botID, expiresKey] = (param.match(/^(\d{17,19})(\S{12})$/) || [, 'null', 'null']);

    let cores = coreArray.filter((core) => { return (core.botID == botID && core.expiresKey == expiresKey); });
    if (cores.length <= 0) {
        res.status(404).send(`ERR! cant found member checker core (${botID}, ${expiresKey})`);
        console.log(`ERR! cant found member checker core (${botID}, ${expiresKey})`);
        return;
    }

    let core = cores[0];
    try {
        let headers = { "Content-Type": "application/x-www-form-urlencoded" };
        let body = `client_id=${core.botID}`
        body += `&client_secret=${core.clientSecret}`
        body += '&grant_type=authorization_code'
        body += `&code=${req.query.code}`
        body += `&redirect_uri=${redirectUri}/callback`
        body += '&scope=connections'
        // get oauth2 token
        let tokenResponse = await post({ url: `${API_ENDPOINT}/oauth2/token`, headers, body, json: true })
        let { access_token } = tokenResponse.body;
        // response.body = {
        //     access_token: '------------------------------', expires_in: 604800,
        //     refresh_token: '------------------------------', scope: 'connections', token_type: 'Bearer'
        // }

        // get user connections
        headers = { Authorization: "Bearer " + access_token }
        let identify = await get({ url: `${API_ENDPOINT}/users/@me`, headers, json: true })
        let connections = await get({ url: `${API_ENDPOINT}/users/@me/connections`, headers, json: true })
        // get user data
        let cID = null;         // YT channel ID
        let dID = null;         // Discord user ID
        let username = null;    // Discord user name
        let tag = null;         // Discord user tag number

        if (identify.body) {
            dID = identify.body.id;
            username = identify.body.username;
            tag = identify.body.discriminator;
        }

        // get discord user connections data
        if (connections.body && Array.isArray(connections.body)) {
            for (let connect of connections.body) {
                if (connect.type != 'youtube') { continue; }
                cID = connect.id;
                break;
            }
        }

        // didn't found youtube cID
        if (cID == null) {
            let html = [
                `User: ${username}`,
                `Youtube channel: ERROR! Can't found connect data!`,
                `               : 錯誤! 找不到帳號連結資訊!`
            ].join('<br>')

            res.send(html);
            return;
        }

        // insert data
        if (await core.pg.insertData(dID, cID) == null) {
            let html = [
                `User: ${username}`,
                `Database channel: ERROR! PG insert data error!`,
                `                : 資料庫錯誤! ${dID}, ${cID}`
            ].join('<br>')

            res.send(html);
            return;
        }

        // get result
        let userData = await core.pg.getDataByDiscordID(dID);
        let html = [
            `User: ${username}`,
            `Youtube channel: https://www.youtube.com/channel/${cID}`,
            `expires in time: ${new Date(parseInt(userData[core.expiresKey])).toLocaleString('en-ZA', { timeZone: 'Asia/Taipei' })}`
        ].join('<br>')

        res.send(html);

        for (core of cores) {
            // log
            core.dcPushEmbed(new EmbedBuilder().setColor(Colors.Green).setDescription(`申請完成: ${username}@${tag} <@${dID}>`));

            // delete this user's data from cache if on stream
            if (core.cacheMemberList.includes(cID)) { core.cacheMemberList = core.cacheMemberList.filter((e) => e != cID); }
        }
        return;
    } catch (e) {
        console.log(e)
        res.send(e.message);
        return;
    }

    // {
    //     identify.body = {
    //         accent_color: null, avatar: '0b69434e070a29d575737ed159a29224',
    //         banner: null, banner_color: null, discriminator: '8676', flags: 0,
    //         id: '353625493876113440', locale: 'zh-TW', mfa_enabled: true,
    //         public_flags: 0, username: 'K.T.710'
    //     }

    //     connections.body[0] = {
    //         friend_sync: false, id: 'UC-JsTXzopVL28gQXEUV276w', name: 'K.T.',
    //         show_activity: true, type: 'youtube', verified: true, visibility: 1
    //     }
    // }
});

// online bot cfg
module.exports = {
    botName: 'DICE',
    botID: '427025310291197954',
    discordToken: process.env.DISCORD_427025310291197954_BOTTOKEN,
    clientSecret: process.env.null,
    resonance: 'ダイ',
    debugPlugins: [
        `ping`,
        // 'uptimer',
        'rssbot', 'dlsitebot',
        'memberCounter',
        // 'spambotKicker',
        'streamStartTime',
        'reactionRole',
        'superChat',
    ],

    debugChannelID: '1024627739023650827',

    herokuToken: process.env.HEROKU_TOKEN,

    youtube: {
        apiKey: [
            // process.env.YOUTUBE_APIKEY_1, process.env.YOUTUBE_APIKEY_2, process.env.YOUTUBE_APIKEY_3,
            // process.env.YOUTUBE_APIKEY_4, process.env.YOUTUBE_APIKEY_5, process.env.YOUTUBE_APIKEY_6, 
            process.env.YOUTUBE_APIKEY_A, process.env.YOUTUBE_APIKEY_B,
        ],
        quotaExceeded: [
        ],

        keyQuotaExceeded(key) {
            let i = this.APIKEY.indexOf(key);
            this.quotaExceeded.push(this.APIKEY.splice(i, 1));
            return !!this.getRandomAPIKey();
        },

        getRandomAPIKey() {
            if (this.APIKEY.length > 0) {
                let index = parseInt(Math.random() * this.APIKEY.length);
                return this.APIKEY[index];
            }
            return null;
        },
    }
}

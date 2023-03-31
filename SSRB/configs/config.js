
// online bot cfg
module.exports = {
    botName: 'SSRB',
    botID: '713624995372466179',
    discordToken: process.env.DISCORD_713624995372466179_BOTTOKEN,
    clientSecret: process.env.DISCORD_713624995372466179_SECRET,
    resonance: 'ぼた',
    debugPlugins: [
        `ping`
    ],

    debugChannelID: '826992877925171250',

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

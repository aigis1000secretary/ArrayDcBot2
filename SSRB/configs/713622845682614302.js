
module.exports = {      // KTG
    name: 'KTG',
    perfix: /(^[\/\-!~])[\S]/,

    memberChecker2: [
        {
            holoChannelID: 'UCUKD-uaobj9jiqB-VXt71mA',   // SSRB
            expiresKey: 'ssrb_expires',
            memberRoleID: '927501058484371487',      // @&SSRB
            logChannelID: '713623232070156309',      // #_log
            streamChannelID: '1010167343378333768',      // #⚫_stream2
            memberChannelID: '1010167418598981652',      // #⚫_member2
            startTagChannelID: null,
            // apiKey: [process.env.YOUTUBE_APIKEY_0, process.env.YOUTUBE_APIKEY_7],   // SSRB
            // apiKey: [process.env.YOUTUBE_APIKEY_8, process.env.YOUTUBE_APIKEY_9],   // KZMI
            apiKey: [process.env.YOUTUBE_APIKEY_A, process.env.YOUTUBE_APIKEY_B],   // TEST
        },
        // {
        //     holoChannelID: 'UCc88OV45ICgHbn3ZqLLb52w',   // Fuma
        //     holoChannelID: 'UCmbs8T6MWqUHP1tIQvSgKrg',   // Kronii
        //     holoChannelID: 'UC-hM6YJuNYVAmUWxeIr9FeA',   // mikp
        //     holoChannelID: 'UCFTLzh12_nrtzqBPsTCqenA',   // aki
        //     holoChannelID: 'UCs9_O1tRPMQTHQ-N_L6FU2g',   // rui
        //     holoChannelID: 'UC1uv2Oq6kNxgATlCiez59hw',   // towa
        // }
    ],

    // messageLogger: { LOG_CHANNEL_ID: '1009645372831977482' },      // #_bot-test

    // uptimer: {},
    ping: {},
}
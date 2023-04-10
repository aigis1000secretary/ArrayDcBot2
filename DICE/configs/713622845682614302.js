
module.exports = {      // KTG
    name: 'KTG',
    perfix: /(^[\/\-!~])[\S]/,

    memberChecker3: [
        {
            holoChannelID: 'UCUKD-uaobj9jiqB-VXt71mA',   // SSRB
            expiresKey: 'ssrb_expires',
            memberRoleID: '1009001004454383656',      // @&TEST
            logChannelID: '713623232070156309',      // #_log
            streamChannelID: '1008565763260551188',      // #⚫_stream
            memberChannelID: '1010005672152281218',      // #⚫_member
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
    reportThread: {
        REPORT_CHANNEL_ID: '1024627536862400582',      // #_report
        ADMIN_ROLE_ID: '881775866835763240',      // @&==BOT==
    },

    // messageLogger: { LOG_CHANNEL_ID: '1009645372831977482' },      // #_bot-test

    memberCounter: { COUNTER_CHANNEL_ID: '1024628239865491486' },      // #群組人數: 4,840

    ping: {},
}

module.exports = {      // KTG
    name: 'KTG',
    perfix: /(^[\/\-!~])[\S]/,

    memberChecker3: [
        // {
        //     holoChannelID: 'UCUKD-uaobj9jiqB-VXt71mA',   // SSRB
        //     expiresKey: 'ssrb_expires',
        //     memberRoleID: '1009001004454383656',      // @&TEST
        //     logChannelID: '713623232070156309',      // #_log
        //     streamChannelID: '1008565763260551188',      // #⚫_stream
        //     memberChannelID: '1010005672152281218',      // #⚫_member
        //     // apiKey: [process.env.YOUTUBE_APIKEY_0, process.env.YOUTUBE_APIKEY_7],   // SSRB
        //     // apiKey: [process.env.YOUTUBE_APIKEY_8, process.env.YOUTUBE_APIKEY_9],   // KZMI
        //     apiKey: [process.env.YOUTUBE_APIKEY_A, process.env.YOUTUBE_APIKEY_B],   // TEST
        // },
        {
            holoChannelID: 'UCUKD-uaobj9jiqB-VXt71mA',   // SSRB
            // apiKey: [process.env.YOUTUBE_APIKEY_0, process.env.YOUTUBE_APIKEY_7],   // SSRB
            // apiKey: [process.env.YOUTUBE_APIKEY_8, process.env.YOUTUBE_APIKEY_9],   // KZMI
            apiKey: [process.env.YOUTUBE_APIKEY_A, process.env.YOUTUBE_APIKEY_B],   // TEST
            expiresKey: 'testa_expires',

            memberRoleID: '1009001004454383656',          // @&TEST1
            logChannelID: '1009645372831977482',         // #⁠_bot-test
            streamChannelID: '1008565763260551188',      // #⚫_stream
            memberChannelID: '1010005672152281218',      // #⚫_member
        },
        {
            holoChannelID: 'UCZlDXzGoo7d44bwdNObFacg',   // kanata
            // apiKey: [process.env.YOUTUBE_APIKEY_0, process.env.YOUTUBE_APIKEY_7],   // SSRB
            // apiKey: [process.env.YOUTUBE_APIKEY_8, process.env.YOUTUBE_APIKEY_9],   // KZMI
            apiKey: [process.env.YOUTUBE_APIKEY_A, process.env.YOUTUBE_APIKEY_B],   // TEST
            expiresKey: 'testb_expires',

            memberRoleID: '1110090223821520906',          // @&TEST2
            logChannelID: '1009645372831977482',         // #⁠_bot-test
            streamChannelID: '1010167343378333768',      // #⚫_stream2
            memberChannelID: '1010167418598981652',      // #⚫_member2
        },
        // {
        //     holoChannelID: 'UC_vMYWcDjmfdpH6r4TTn1MQ',   // kazama
        //     holoChannelID: 'UCc88OV45ICgHbn3ZqLLb52w',   // Fuma
        //     holoChannelID: 'UCmbs8T6MWqUHP1tIQvSgKrg',   // Kronii
        //     holoChannelID: 'UC-hM6YJuNYVAmUWxeIr9FeA',   // mikp
        //     holoChannelID: 'UCFTLzh12_nrtzqBPsTCqenA',   // aki
        //     holoChannelID: 'UCs9_O1tRPMQTHQ-N_L6FU2g',   // rui
        //     holoChannelID: 'UC1uv2Oq6kNxgATlCiez59hw',   // towa
        // }
    ],

    // messageLogger: { LOG_CHANNEL_ID: '1009645372831977482' },      // #_bot-test

    ping: {},
}
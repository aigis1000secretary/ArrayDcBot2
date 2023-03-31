
const [EMOJI_HAMMER_AND_WRENCH, EMOJI_BIRD, EMOJI_ALARM_CLOCK] = ['🛠️', '🐦', '⏰']
const EMOJI_REBOOTED = (process.env.HOST_TYPE == 'FLY_IO' ? EMOJI_BIRD : EMOJI_ALARM_CLOCK);

const fs = require('fs');
const path = require('path');
const { discordToken, debugChannelID, debugPlugins } = require('./configs/config.js');

// discord
const Discord = require('discord.js');
const { GatewayIntentBits, Partials } = require('discord.js');


module.exports = {
    async init() {
        // client init
        const client = new Discord.Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.MessageContent
            ],
            partials: [
                Partials.Message,
                Partials.Channel,
                Partials.Reaction
            ]
        });

        client.commands = new Discord.Collection();

        client.mainConfigs = new Object();
        client.guildConfigs = new Discord.Collection();

        // require configs
        let filepath = path.join(__dirname, `./configs/`);
        if (fs.existsSync(filepath)) {
            // get all js file list
            const configFiles = fs.readdirSync(filepath)
                .filter(file => file.endsWith('.js'));

            for (const file of configFiles) {
                const { name } = path.parse(file);

                if (name == 'config') {

                    client.mainConfigs = require(`${filepath}${file}`);

                } else if (/^\d+$/.test(name)) {

                    const config = require(`${filepath}${file}`);
                    client.guildConfigs.set(name, config);

                }
            }
        }

        let plugins = [];
        for (let [gID, gConfig] of client.guildConfigs) {

            // get plugins name
            for (let pluginName of Object.keys(gConfig)) {

                if (['name', 'perfix', 'getCommandLineArgs'].includes(pluginName)) { continue; }
                if (plugins.includes(pluginName)) { continue; }

                plugins.push(pluginName);
            }
        }

        // require plugins
        filepath = path.join(__dirname, `./plugins/`);
        if (fs.existsSync(filepath)) {
            // get all js file list
            const pluginFiles = fs.readdirSync(filepath)
                .filter(file => file.endsWith('.js'));

            for (const file of pluginFiles) {
                const { name } = path.parse(file);

                if (!plugins.includes(name)) { continue; }
                // // in debug mode, only run plugin in list
                // if (process.env.HOST_TYPE == 'debug' && !debugPlugins.includes(name)) { continue; }

                const plugin = require(`${filepath}${file}`);
                client.commands.set(name, plugin);

            }
        }

        client.getPluginConfig = function (gID, pluginNname) {
            let guildConfig = this.guildConfigs.get(gID);
            if (!guildConfig) { return null; }
            return guildConfig[pluginNname] || null;
        }

        // text command
        client.on('messageCreate', async (message) => {
            // Emitted 
            for (let [key, value] of client.commands) {
                if (!value.execute || typeof (value.execute) != "function") { continue; }

                let { client, guildId } = message;

                // get pluginConfig
                const pluginConfig = client.getPluginConfig(guildId, key);
                if (!pluginConfig) { continue; }

                // get cmd / args
                const guildConfig = client.guildConfigs.get(guildId);
                const { command, args } = guildConfig.getCommandLineArgs(message.content);

                // call funstion
                value.execute(message, pluginConfig, command, args);
            }
        });























        // // load plugins
        // if (fs.existsSync(`./plugins/`)) {
        //     // get all js file list
        //     const pluginFiles = fs.readdirSync(`./plugins/`)
        //         .filter(file => file.endsWith('.js'));

        //     // check plugins witch need
        //     let plugins = [];
        //     for (let gID of Object.keys(guildConfigs)) {
        //         plugins = plugins.concat(
        //             Object.keys(guildConfigs[gID]).filter(
        //                 (key) => (
        //                     !plugins.includes(key) &&
        //                     !['name', 'perfix'].includes(key) &&
        //                     // in debug mode, only run plugin in list
        //                     (process.env.HOST_TYPE != 'debug' || debugPlugins.includes(key))
        //                 )
        //             )
        //         );
        //     }

        //     for (const file of pluginFiles) {
        //         const { name } = path.parse(file);

        //         // skip unused plugin
        //         if (!plugins.includes(name)) { continue; }

        //         const plugin = require(`./plugins/${file}`);
        //         client.commands.set(name, plugin);
        //     }
        // }

        // const getCommandLineArgs = (msg) => {
        //     let args = null, command = null;
        //     if (perfix.test(msg)) {
        //         args = msg.slice(1).split(/\s+/);
        //         command = args.shift().toLowerCase();
        //     }
        //     return { command, args };
        // }
        // const getPluginConfig = (gID, pluginName) => {
        //     // not work guild / not work plugin in this guild
        //     if (!guildConfigs[gID] || !guildConfigs[gID][pluginName]) {
        //         return null;
        //     }
        //     return guildConfigs[gID][pluginName];
        // }
        // client.getCommandLineArgs = getCommandLineArgs;
        // client.getPluginConfig = getPluginConfig;

        // // text command
        // client.on('messageCreate', async (message) => {
        //     // Emitted 
        //     for (let [key, value] of client.commands) {
        //         console.log(key)
        //         if (!value.execute || typeof (value.execute) != "function") { continue; }

        //         // get pluginConfig
        //         const pluginConfig = getPluginConfig(message.guildId || 'DM', key);
        //         if (!pluginConfig) { continue; }

        //         // get cmd / args
        //         console.log(`messageCreate`);
        //         const { command, args } = getCommandLineArgs(message.content);

        //         value.execute(message, pluginConfig, command, args);
        //         // .then(result => { console.log(`${value.name.padEnd(20, ' ')}: ${result}`); }); 
        //     }
        // });
        // client.on('messageDelete', async (message) => {
        //     // Emitted 
        //     for (let [key, value] of client.commands) {
        //         if (!value.execute || typeof (value.execute) != "function") { continue; }

        //         // get pluginConfig
        //         const pluginConfig = getPluginConfig(message.guildId || 'DM', key);
        //         if (!pluginConfig) { continue; }

        //         value.messageDelete(message, pluginConfig);
        //         // .then(result => { console.log(`${value.name.padEnd(20, ' ')}: ${result}`); }); 
        //     }
        // });
        // // for discord.js v13
        // client.on('interactionCreate', async (interaction) => {
        //     // Emitted 
        //     for (let [key, value] of client.commands) {
        //         if (!value.interacted || typeof (value.interacted) != "function") { continue; }

        //         // get pluginConfig
        //         const pluginConfig = getPluginConfig(interaction.guildId || 'DM', key);
        //         if (!pluginConfig) { continue; }

        //         value.interacted(interaction, pluginConfig);
        //     }
        // });

        // client.on('messageReactionAdd', async (reaction, user) => {
        //     // Emitted 
        //     for (let [key, value] of client.commands) {
        //         if (!value.messageReactionAdd || typeof (value.messageReactionAdd) != "function") { continue; }

        //         // get pluginConfig
        //         const pluginConfig = getPluginConfig(reaction.message.guildId || 'DM', key);
        //         if (!pluginConfig) { continue; }

        //         value.messageReactionAdd(reaction, user, pluginConfig);
        //     }
        // });

        // client.on('messageReactionRemove', async (reaction, user) => {
        //     // Emitted 
        //     for (let [key, value] of client.commands) {
        //         if (!value.messageReactionRemove || typeof (value.messageReactionRemove) != "function") { continue; }

        //         // get pluginConfig
        //         const pluginConfig = getPluginConfig(reaction.message.guildId || 'DM', key);
        //         if (!pluginConfig) { continue; }

        //         value.messageReactionRemove(reaction, user, pluginConfig);
        //     }
        // });

        // // auto update guild member count
        // client.once('ready', async () => {

        //     // dc bot online
        //     console.log(`=====${botName} is online!=====    setup plugins(${client.commands.size}):`);
        //     if (!fs.existsSync("./.env")) {

        //         // const nowDate = new Date(Date.now());
        //         // const hours = nowDate.getHours().toString().padStart(2, '0');
        //         // const minutes = nowDate.getMinutes().toString().padStart(2, '0');
        //         // await channel.send({ content: `<${hours}:${minutes}> ${botName} is online!` })

        //         const channel = await client.channels.fetch(debugChannelID);

        //         const nowHours = new Date(Date.now()).getHours();
        //         const nowMinutes = new Date(Date.now()).getMinutes();
        //         const rebooted =
        //             ([1, 9, 17].includes(nowHours) && nowMinutes >= 55) ||  // in reboot time
        //             ([2, 10, 18].includes(nowHours) && nowMinutes < 5);     // really reboot time
        //         const type = rebooted ? EMOJI_REBOOTED : EMOJI_HAMMER_AND_WRENCH;
        //         const nowDate = parseInt(Date.now() / 1000);
        //         await channel.send({ content: `<t:${nowDate}>  <t:${nowDate}:R> 📳! ${type}` })
        //     }

        //     // Emitted 
        //     for (let [key, value] of client.commands) {
        //         if (!value.setup || typeof (value.setup) != "function") { continue; }

        //         value.setup(client);

        //         if (fs.existsSync("./.env")) {
        //             console.log(`··${value.name.padEnd(20, ' ')} <${value.description}>`);
        //         }
        //     }

        // });

        client.once('close', () => {
            // offline msg
            console.log(`${botName} is offline!`);

            // destroy dc thread
            client.destroy();
        });

        // dc login
        await client.login(discordToken);  //.then(console.log);
        return client;
    },
}

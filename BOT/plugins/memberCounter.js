module.exports = {
    name: 'memberCounter',
    description: "member counter",
    interval: null,
    client: null,

    async clockMethod(nowTime) {
        if (!this.client) { return; }

        for (let gID of this.client.guildConfigs.keys()) {

            const pluginConfig = this.client.getPluginConfig(gID, 'memberCounter');
            if (!pluginConfig) { continue; }
            const cID = pluginConfig.COUNTER_CHANNEL_ID;

            const guild = await this.client.guilds.fetch(gID);
            if (!guild) { continue; }
            const channel = await this.client.channels.fetch(cID);
            if (!channel) { continue; }

            const memberCount = guild.memberCount;
            const channelName = channel.name;

            await channel.setName(`群組人數: ${memberCount.toLocaleString()}`).catch((error) => { console.log(error.message); });

            // if (channelName != channel.name) {
            //     console.log('Updating Member Count');
            // }
        }
    },

    setup(client) {
        this.client = client;

        // clock
        const timeoutMethod = () => {
            const now = Date.now();
            // get trim time
            const nowTime = (now % 1000 > 500) ? (now - (now % 1000) + 1000) : (now - (now % 1000));
            // check every 5sec
            const nextTime = nowTime + 5000;
            const offsetTime = nextTime - now;
            this.interval = setTimeout(timeoutMethod, offsetTime);

            this.clockMethod(now);
        }
        this.interval = setTimeout(timeoutMethod, 2000);
        client.once('close', () => {
            clearTimeout(this.interval);
        });

    }
}
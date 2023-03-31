
module.exports = {
    name: 'ping',
    description: 'pong',
    execute(message, pluginConfig, command, args) {

        if (command != 'ping') { return; }

        message.reply({ content: `pong!`, allowedMentions: { repliedUser: false } }).catch(() => { });
    },
}
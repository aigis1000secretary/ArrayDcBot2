
// const path = require('path');

module.exports = {
    name: 'reboot',
    description: "reboot command",

    execute(message, pluginConfig, command, args, lines) {

        if ('reboot' != command) { return; }
        if (message.author.id != '353625493876113440') { return; }

        // let filepath = path.join(__dirname, `../../index.js`);
        require(`../../index.js`).terminate();
        return true;
    },
}
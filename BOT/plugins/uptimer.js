
class timerCore {
    client = null;
    interval = null;

    clockMethod = (nowTime) => {
        const nowDate = new Date(nowTime);
        const hours = nowDate.getHours();
        const minutes = nowDate.getMinutes();
        const seconds = nowDate.getSeconds();
        const milliSec = nowDate.getMilliseconds();

        console.log(`clockMethod`,
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
            `${milliSec.toString().padStart(3, '0')}`
        );
    }

    constructor(_client) {
        this.client = _client;

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
}

const coreArray = new Map();

module.exports = {
    name: 'uptimer',
    description: "uptume timer",
    interval: {},

    setup(client) {
        new timerCore(client);
        new timerCore(client);
        // let core = new timerCore(client);
        // coreArray.set(client.user.id, core);
    },
}

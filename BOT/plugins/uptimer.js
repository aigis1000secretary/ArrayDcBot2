
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

        // clock
        const timeoutMethod = () => {
            const now = Date.now();
            // get trim time
            const nowTime = (now % 1000 > 500) ? (now - (now % 1000) + 1000) : (now - (now % 1000));
            // check every 1sec
            const nextTime = nowTime + 1000;
            const offsetTime = nextTime - now;
            this.interval = setTimeout(timeoutMethod, offsetTime);

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

const createRateLimiter = ({ minIntervalMs = 0, maxConcurrent = 1 } = {}) => {
    let active = 0;
    let lastRun = 0;
    const queue = [];

    const runNext = () => {
        if (active >= maxConcurrent || queue.length === 0) return;
        const now = Date.now();
        const wait = Math.max(0, minIntervalMs - (now - lastRun));
        const task = queue.shift();

        active += 1;
        setTimeout(async () => {
            lastRun = Date.now();
            try {
                const result = await task.fn();
                task.resolve(result);
            } catch (err) {
                task.reject(err);
            } finally {
                active -= 1;
                runNext();
            }
        }, wait);
    };

    const schedule = (fn) =>
        new Promise((resolve, reject) => {
            queue.push({ fn, resolve, reject });
            runNext();
        });

    return { schedule };
};

module.exports = {
    createRateLimiter,
};

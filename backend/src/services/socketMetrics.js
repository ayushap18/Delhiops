const metrics = {
    activeConnections: 0,
    totalConnections: 0,
    messagesSent: 0,
    messagesReceived: 0,
    errors: 0,
    throughput: {
        sentPerMinute: 0,
        receivedPerMinute: 0,
    },
    latency: {
        averageMs: 0,
        minMs: null,
        maxMs: null,
        samples: 0,
    },
    lastReset: Date.now(),
};

const rollWindow = () => {
    const now = Date.now();
    if (now - metrics.lastReset >= 60000) {
        metrics.throughput.sentPerMinute = metrics.messagesSent - (metrics._sentTotalAtReset || 0);
        metrics.throughput.receivedPerMinute = metrics.messagesReceived - (metrics._receivedTotalAtReset || 0);
        metrics._sentTotalAtReset = metrics.messagesSent;
        metrics._receivedTotalAtReset = metrics.messagesReceived;
        metrics.lastReset = now;
    }
};

const recordConnection = () => {
    metrics.activeConnections += 1;
    metrics.totalConnections += 1;
};

const recordDisconnection = () => {
    metrics.activeConnections = Math.max(0, metrics.activeConnections - 1);
};

const recordMessageSent = (count = 1) => {
    metrics.messagesSent += count;
    rollWindow();
};

const recordMessageReceived = (count = 1) => {
    metrics.messagesReceived += count;
    rollWindow();
};

const recordError = () => {
    metrics.errors += 1;
};

const recordLatency = (latencyMs) => {
    if (latencyMs === null || latencyMs === undefined) return;
    metrics.latency.samples += 1;
    metrics.latency.averageMs =
        metrics.latency.averageMs +
        (latencyMs - metrics.latency.averageMs) / metrics.latency.samples;
    metrics.latency.minMs =
        metrics.latency.minMs === null ? latencyMs : Math.min(metrics.latency.minMs, latencyMs);
    metrics.latency.maxMs =
        metrics.latency.maxMs === null ? latencyMs : Math.max(metrics.latency.maxMs, latencyMs);
};

const snapshot = () => {
    rollWindow();
    return {
        activeConnections: metrics.activeConnections,
        totalConnections: metrics.totalConnections,
        messagesSent: metrics.messagesSent,
        messagesReceived: metrics.messagesReceived,
        errors: metrics.errors,
        throughput: { ...metrics.throughput },
        latency: { ...metrics.latency },
        lastReset: metrics.lastReset,
    };
};

module.exports = {
    recordConnection,
    recordDisconnection,
    recordMessageSent,
    recordMessageReceived,
    recordError,
    recordLatency,
    snapshot,
};

const logger = require('../utils/logger');
const { serviceUnavailable } = require('../utils/errors');

const STATES = { CLOSED: 'CLOSED', OPEN: 'OPEN', HALF_OPEN: 'HALF_OPEN' };

const registry = new Map();

const createCircuitBreaker = ({ name, failureThreshold = 5, resetTimeoutMs = 30000, halfOpenMax = 1 }) => {
    const breaker = {
        name,
        state: STATES.CLOSED,
        failures: 0,
        successes: 0,
        lastFailure: null,
        lastStateChange: Date.now(),
        halfOpenAttempts: 0,
        failureThreshold,
        resetTimeoutMs,
        halfOpenMax,
    };

    registry.set(name, breaker);

    const transition = (newState) => {
        const prev = breaker.state;
        breaker.state = newState;
        breaker.lastStateChange = Date.now();
        if (newState === STATES.HALF_OPEN) {
            breaker.halfOpenAttempts = 0;
        }
        if (newState === STATES.CLOSED) {
            breaker.failures = 0;
        }
        logger.info('Circuit breaker state change', { name, from: prev, to: newState });
    };

    const execute = async (fn) => {
        if (breaker.state === STATES.OPEN) {
            if (Date.now() - breaker.lastStateChange >= breaker.resetTimeoutMs) {
                transition(STATES.HALF_OPEN);
            } else {
                throw serviceUnavailable(`Circuit breaker '${name}' is open`);
            }
        }

        if (breaker.state === STATES.HALF_OPEN && breaker.halfOpenAttempts >= breaker.halfOpenMax) {
            throw serviceUnavailable(`Circuit breaker '${name}' is half-open, probe limit reached`);
        }

        if (breaker.state === STATES.HALF_OPEN) {
            breaker.halfOpenAttempts++;
        }

        try {
            const result = await fn();
            breaker.successes++;
            if (breaker.state === STATES.HALF_OPEN) {
                transition(STATES.CLOSED);
            }
            if (breaker.state === STATES.CLOSED) {
                breaker.failures = 0;
            }
            return result;
        } catch (err) {
            breaker.failures++;
            breaker.lastFailure = Date.now();

            if (breaker.state === STATES.HALF_OPEN) {
                transition(STATES.OPEN);
            } else if (breaker.failures >= breaker.failureThreshold) {
                transition(STATES.OPEN);
            }
            throw err;
        }
    };

    const getState = () => ({
        name: breaker.name,
        state: breaker.state,
        failures: breaker.failures,
        successes: breaker.successes,
        lastFailure: breaker.lastFailure,
        lastStateChange: breaker.lastStateChange,
    });

    return { execute, getState };
};

const getCircuitStates = () => {
    const states = {};
    for (const [name, breaker] of registry) {
        states[name] = {
            state: breaker.state,
            failures: breaker.failures,
            successes: breaker.successes,
            lastFailure: breaker.lastFailure,
            lastStateChange: breaker.lastStateChange,
        };
    }
    return states;
};

module.exports = {
    createCircuitBreaker,
    getCircuitStates,
};

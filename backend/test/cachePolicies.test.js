const test = require('node:test');
const assert = require('node:assert');

const { getPolicy } = require('../src/services/cachePolicies');

test('aqi policy is stale-while-revalidate', () => {
    const policy = getPolicy('aqi');
    assert.strictEqual(policy.strategy, 'stale_while_revalidate');
    assert.ok(policy.ttlSeconds > 0);
});

test('traffic policy is background refresh', () => {
    const policy = getPolicy('traffic');
    assert.strictEqual(policy.strategy, 'background_refresh');
    assert.ok(policy.ttlSeconds > 0);
});

test('unknown policy falls back to static config', () => {
    const policy = getPolicy('does-not-exist');
    assert.ok(policy.ttlSeconds >= 0);
});

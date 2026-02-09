const test = require('node:test');
const assert = require('node:assert');

const { l1Cache } = require('../src/services/l1Cache');

test('l1 cache set/get works', () => {
    l1Cache.set('test:key:1', { value: 1 }, 30);
    const entry = l1Cache.get('test:key:1');
    assert.ok(entry);
    assert.strictEqual(entry.value.value, 1);
});

test('l1 cache delete by prefix works', () => {
    l1Cache.set('test:prefix:a', { value: 'a' }, 30);
    l1Cache.set('test:prefix:b', { value: 'b' }, 30);
    l1Cache.deleteByPrefix('test:prefix');
    assert.strictEqual(l1Cache.get('test:prefix:a'), null);
    assert.strictEqual(l1Cache.get('test:prefix:b'), null);
});

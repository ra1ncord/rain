import assert from 'node:assert/strict';
import test from 'node:test';
import { invokeRainBridge } from '../src/api/native/bridge-call.ts';

const noLegacy = () => { throw new Error('Legacy transport should not be used'); };
test('JSI async is preferred and receives the native envelope', async () => {
    let received;
    const host = {
        __RAIN_BRIDGE_CALL_ASYNC__: async p => { received = p; return { result: 42 }; },
        __RAIN_BRIDGE_CALL_SYNC__: noLegacy,
    };
    assert.equal(await invokeRainBridge(host, noLegacy, 'example', ['a']), 42);
    assert.deepEqual(received, { rain: { method: 'example', args: ['a'] } });
});
test('sync JSI is supported', async () => {
    assert.equal(await invokeRainBridge({ __RAIN_BRIDGE_CALL_SYNC__: () => ({ result: null }) }, noLegacy, 'x', []), null);
});
test('older loaders can still use FileReader', async () => {
    assert.equal(await invokeRainBridge({}, async () => ({ result: false }), 'x', []), false);
});
test('native errors propagate without retrying a mutating operation', async () => {
    await assert.rejects(invokeRainBridge({ __RAIN_BRIDGE_CALL_ASYNC__: () => { throw new Error('failed'); } }, noLegacy, 'x', []), /failed/);
    await assert.rejects(invokeRainBridge({ __RAIN_BRIDGE_CALL_ASYNC__: () => ({ error: 'denied' }) }, noLegacy, 'x', []), /denied/);
});
test('malformed native responses fail explicitly', async () => {
    for (const response of [null, undefined, 42, {}, 'bad']) {
        await assert.rejects(invokeRainBridge({ __RAIN_BRIDGE_CALL_SYNC__: () => response }, noLegacy, 'x', []));
    }
});

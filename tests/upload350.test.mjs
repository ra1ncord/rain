import test from "node:test";
import assert from "node:assert/strict";
import { compile, evaluate } from "./runtimeHarness.mjs";

const code = await compile("src/plugins/bypassuploadlimit/patches/upload.ts", {
    "@api/assets": "export const findAssetId=()=>0",
    "@api/ui/toasts": "export const showToast=()=>{}",
    "@lib/utils/logger": "export const logger={info(){},warn(){},error(){}}",
    "@metro": "export const findByProps=(...keys)=>env.find(...keys)",
    "@metro/common": "export const clipboard={setString(){}}",
    "@metro/wrappers": "export const findByProps=(...keys)=>env.find(...keys)",
    "../api/catbox": "export const uploadToCatbox=()=>{throw Error('unexpected upload')}",
    "../api/litterbox": "export const uploadToLitterbox=()=>{throw Error('unexpected upload')}",
    "../api/uguu": "export const uploadToUguu=()=>{throw Error('unexpected upload')}",
    "../api/zipline": "export const uploadToZipline=()=>{throw Error('unexpected upload')}",
    "../storage": "export const uploaderSettings={alwaysUpload:false,selectedHost:'catbox'}"
});
function fixture({ missing = false, locked = false } = {}) {
    const env = {};
    const original = function() { return "stock upload"; };
    const sendMessage = function() { return "stock send"; };
    const limit = () => 10485760;
    class CloudUpload {}
    CloudUpload.prototype.reactNativeCompressAndExtractData = original;
    const sender = { sendMessage };
    const utils = { maxFileSize: limit, getUploadFileSizeSum() {} };
    if (locked) Object.freeze(utils);
    const modules = [{ CloudUpload }, sender, ...(missing ? [] : [utils])];
    env.find = (...keys) => modules.find(mod => keys.every(key => key in mod));
    const { exports } = evaluate(code, env);
    return { start: exports.default, CloudUpload, sender, utils, original, sendMessage, limit };
}
test("real upload patch enables on 350 exports, preserves small uploads and restores on stop", async () => {
    const f = fixture();
    const undo = f.start();
    assert.equal(f.utils.maxFileSize(), Number.MAX_SAFE_INTEGER);
    assert.equal(await f.CloudUpload.prototype.reactNativeCompressAndExtractData.call({ preCompressionSize: 1024 }), "stock upload");
    undo.forEach(fn => fn());
    assert.equal(f.utils.maxFileSize, f.limit);
    assert.equal(f.CloudUpload.prototype.reactNativeCompressAndExtractData, f.original);
    assert.equal(f.sender.sendMessage, f.sendMessage);
});
test("missing size exports leave upload and send methods untouched", () => {
    const f = fixture({ missing: true });
    assert.throws(f.start, /unavailable/);
    assert.equal(f.CloudUpload.prototype.reactNativeCompressAndExtractData, f.original);
    assert.equal(f.sender.sendMessage, f.sendMessage);
});
test("a real patcher rejection rolls back the previously installed hooks", () => {
    const f = fixture({ locked: true });
    assert.throws(f.start);
    assert.equal(f.CloudUpload.prototype.reactNativeCompressAndExtractData, f.original);
    assert.equal(f.sender.sendMessage, f.sendMessage);
    assert.equal(f.utils.maxFileSize, f.limit);
});

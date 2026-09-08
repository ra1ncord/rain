import { after } from "@api/patcher";
import { findByName } from "@metro";
import { waitFor } from "@metro/internals/modules";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";

const NAME = "getMediaViewerStateForScreen";
let unpatch: (() => void) | null = null;
let cancelWait: (() => void) | null = null;

function patchRet(_args: any[], ret: any) {
    ret.maximumZoomScale = 100;
    return ret;
}

function hook(mod: any) {
    unpatch = after("default", mod, patchRet);
}

export default definePlugin({
    name: "UnlimitedZoom",
    description: "Removes the zoom limit on the media viewer",
    author: [Developers.Livie],
    id: "unlimitedzoom",
    version: "1.0.0",
    start() {
        const mod = findByName(NAME, false);
        if (mod) return hook(mod);
        cancelWait = waitFor(m => (m?.default?.name === NAME ? m : undefined), hook);
    },
    stop() {
        unpatch?.();
        cancelWait?.();
        unpatch = null;
        cancelWait = null;
    },
});

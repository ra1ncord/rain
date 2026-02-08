import { definePlugin } from "@plugins";
import { ReactNative as RN } from "@metro/common";
import { instead } from "@api/patcher";

let onUnload: () => void;
const patches: any[] = [];

export default definePlugin({
    name: "Bluetooth Audio Fix",
    description: "Prevents Discord from enabling handsfree mode while in a call",
    author: [
        { name: "Narwhal", id: 455429792871874581n },
        { name: "redstonekasi", id: 265064055490871297n }
    ],
    id: "bluetoothaudiofix",
    version: "v1.0.0",
    start() {
        onUnload = instead("setCommunicationModeOn", RN.TurboModuleRegistry.get("NativeAudioManagerModule") === null ? RN.TurboModuleRegistry.get("RTNAudioManager") : RN.TurboModuleRegistry.get("NativeAudioManagerModule"), () => {});
    },
    stop() {
        for (const unpatch of patches) unpatch();
    },
})
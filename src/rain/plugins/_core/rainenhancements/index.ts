import { instead } from "@api/patcher";
import { ReactNative as RN } from "@metro/common";
import { definePlugin } from "@plugins";
import { Platform } from "react-native";

import { patchConsole, patchMiscellaneous, patchNetwork, patchSentry } from "./notrack";
import transformEmoji from "./realmoji/patches/transformEmoji";
import transformSticker from "./realmoji/patches/transformSticker";
import settings from "./settings";

let patches: any[] = [];

export default definePlugin({
    name: "RainEnhancements",
    description: "Combines many plugins into one to improve your experience",
    author: [{ name: "cocobo1", id: 767650984175992833n }, { name: "j", id: 1356632712861192242n }, { name: "rico040", id: 619474349845643275n }, { name: "Narwhal", id: 455429792871874581n }, { name: "redstonekasi", id: 265064055490871297n }],
    id: "rainenhancements",
    version: "v1.0.0",
    start() {
        // NoTrack
        patches = [
            patchNetwork(),
            patchConsole(),
            patchMiscellaneous(),
            patchSentry(),
        ].filter(Boolean);

        // BluetoothAudioFix
        if (Platform.OS != "ios") {
            const onUnload = RN.TurboModuleRegistry.get("NativeAudioManagerModule") === null ? RN.TurboModuleRegistry.get("RTNAudioManager") : RN.TurboModuleRegistry.get("NativeAudioManagerModule");
            patches.push(instead("setCommunicationModeOn", onUnload, () => {}));
        }

        // Realmoji
        patches.push(...transformEmoji);
        patches.push(...transformSticker);
    },
    settings: settings
});

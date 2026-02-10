import { instead } from "@api/patcher";
import { ReactNative as RN } from "@metro/common";
import { Platform } from "react-native";
import { definePlugin } from "@plugins";

const patches: any[] = [];

export default definePlugin({
    name: "BluetoothAudioFix",
    description: "Prevents Discord from enabling handsfree mode while in a call",
    author: [
        { name: "Narwhal", id: 455429792871874581n },
        { name: "redstonekasi", id: 265064055490871297n }
    ],
    id: "bluetoothaudiofix",
    version: "v1.0.0",
    start() {
        if (Platform.OS == "ios") { return }

        const onUnload = RN.TurboModuleRegistry.get("NativeAudioManagerModule") === null ? RN.TurboModuleRegistry.get("RTNAudioManager") : RN.TurboModuleRegistry.get("NativeAudioManagerModule");
        patches.push(instead("setCommunicationModeOn", onUnload, () => {}));
    },
    stop() {
        for (const unpatch of patches) unpatch();
    },
})

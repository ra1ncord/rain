import { instead } from "@api/patcher";
import { showToast } from "@api/ui/toasts";
import { ReactNative as RN } from "@metro/common";
import { definePlugin, usePluginSettings } from "@plugins";
import { Platform } from "react-native";
import {Developers} from "@rain/Developers";

const patches: any[] = [];

export default definePlugin({
    name: "BluetoothAudioFix",
    description: "Prevents Discord from enabling handsfree mode while in a call",
    author: [
        Developers.Narwhal,
        Developers.redstonekasi,
        Developers.reyyan1
    ],
    id: "bluetoothaudiofix",
    version: "1.0.0",
    start() {
        if (Platform.OS === "ios") {
            showToast("This plugin does not do anything on iOS");
            usePluginSettings.getState().updatePluginSetting("bluetoothaudiofix", false);
            return;
        }

        const onUnload = RN.TurboModuleRegistry.get("NativeAudioManagerModule") === null ? RN.TurboModuleRegistry.get("RTNAudioManager") : RN.TurboModuleRegistry.get("NativeAudioManagerModule");
        patches.push(instead("setCommunicationModeOn", onUnload, () => {}));
    },
    stop() {
        for (const unpatch of patches) unpatch();
    },
});

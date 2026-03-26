import { instead } from "@api/patcher";
import { showToast } from "@api/ui/toasts";
import { ReactNative as RN } from "@metro/common";
import { definePlugin, usePluginSettings } from "@plugins";
import { Contributors,Developers } from "@rain/Developers";
import { Strings } from "@rain/i18n";
import { Platform } from "react-native";

const patches: any[] = [];

export default definePlugin({
    name: "BluetoothAudioFix",
    description: Strings.PLUGINS.CUSTOM.BLUETOOTHFIX.DESCRIPTION,
    author: [
        Contributors.Narwhal,
        Contributors.redstonekasi,
        Developers.reyyan1
    ],
    id: "bluetoothaudiofix",
    version: "1.0.0",
    platforms: ["android"],
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

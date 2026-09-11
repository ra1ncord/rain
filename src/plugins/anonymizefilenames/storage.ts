import { createPluginStore } from "@api/storage";

interface Settings {
    useCustomName: boolean;
    customName: string;
}

export const { useStore: useAnonymizeSettings, settings: anonymizeSettings } =
    createPluginStore<Settings>("anonymizefilenames", {
        useCustomName: false,
        customName: "",
    });

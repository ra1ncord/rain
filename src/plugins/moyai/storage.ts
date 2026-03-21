import { createPluginStore } from "@api/storage";

interface MoyaiSettings {
    allowReactions: boolean;
}

export const {
    useStore: useMoyaiSettings,
    settings: moyaiSettings,
} = createPluginStore<MoyaiSettings>("moyai", {
    allowReactions: true,
});

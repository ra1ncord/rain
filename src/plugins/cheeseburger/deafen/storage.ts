import { createPluginStore } from "@api/storage";

interface DeafenButtonSettings {
    placeAfter: boolean;
    iconSize: number;
}

export const {
    useStore: useDeafenButtonSettings,
    settings: deafenButtonSettings,
} = createPluginStore<DeafenButtonSettings>("deafenbutton", {
    placeAfter: true,
    iconSize: 26,
});

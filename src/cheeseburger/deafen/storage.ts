import { createPluginStore } from "@api/storage";

interface DeafenButtonSettings {
    placeAfter: boolean;
    iconSize: number;
    sized: boolean;
}

export const {
    useStore: useDeafenButtonSettings,
    settings: deafenButtonSettings,
} = createPluginStore<DeafenButtonSettings>("deafenbutton", {
    placeAfter: true,
    iconSize: 24,
    sized: false,
});

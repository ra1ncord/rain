import { createPluginStore } from "@api/storage";

interface StyleSettings {
    bevelSize: number;
    squareCorners: boolean;
    looks: string[];
}

export const {
    useStore: useStyleSettings,
    settings: styleSettings,
} = createPluginStore<StyleSettings>("cheeseburger-style", {
    bevelSize: 8,
    squareCorners: true,
    looks: [],
});

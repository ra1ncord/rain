import { definePlugin } from "@plugins";
import { Contributors } from "@rain/Developers";

import Settings from "./components/Settings";
import load, { patches } from "./stuff/loader";

export enum PatchType {
Icons = "icons",
CustomIconOverlays = "custom_icon_overlays",
MentionLineColor = "mention_line_color",
Iconpack = "iconpack",
}

export enum InactiveReason {
NoTheme = "no_theme",
ThemesPlusUnsupported = "themes_plus_unsupported",
NoIconpacksList = "no_iconpacks_list",
NoIconpackConfig = "no_iconpack_config",
NoIconpackFiles = "no_iconpack_files",
}

export enum ConfigIconpackMode {
Automatic = "automatic",
Manual = "manual",
Disabled = "disabled",
}

export interface ThemesPlusStorage {
iconpack: {
mode: ConfigIconpackMode;
pack?: string;
custom: {
url: string;
suffix: string;
config: {
biggerStatus: boolean;
};
};
isCustom: boolean;
};
}

// Placeholder for storage since Rain doesn't have a global 'storage' export
export const vstorage: ThemesPlusStorage = {
    iconpack: {
        mode: ConfigIconpackMode.Automatic,
        custom: {
            url: "https://raw.githubusercontent.com/mudrhiod/discord-iconpacks/master/plus/solar-duotone/",
            suffix: "",
            config: {
                biggerStatus: false,
            },
        },
        isCustom: false,
    }
};

export default definePlugin({
    name: "Themes+",
    description: "Adds more customizability to Themes",
    author: [Contributors.nexpid],
    id: "themes-plus",
    version: "1.0.0",
    eagerStart() {
        try {
            load();
        } catch (e) {
            console.log("Themes+ failed to load whoopsies!!", e);
        }
    },
    stop() {
        for (const x of patches) {
            x();
        }
        patches.length = 0;
    },
    settings: Settings,
});

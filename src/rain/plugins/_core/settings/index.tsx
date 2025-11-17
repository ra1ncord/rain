import { findAssetId } from "@lib/api/assets";
import { lazy } from "react";
import type { ImageURISource } from "react-native";
import { patchTabsUI } from "./patches/tabs";
import { definePlugin } from "@plugins";

export default definePlugin({
    name: "settings",
    description: "injects the settings menu",
    author: { name: "cocobo1", id: 123456789012345678n },
    id: "rain.core.settings",
    icon: "cog",
    version: "v1.0.0",
    start() {
        patchSettings();
        initSettings();
    }
});

function initSettings() {
    // todo: i18n ALL of settings
    registerSection({
        name: "Rain",
        items: [
            {
                key: "RAIN",
                title: () => "Rain",
                icon: findAssetId("RobotIcon"),
                render: () => import("./pages/Rain"),
                useTrailing: () => `10% complete`,
            },
            {
                key: "RAIN_PLUGINS",
                title: () => "Plugins",
                icon: findAssetId("PuzzlePieceIcon"),
                render: () => import("./pages/Plugins"),
                useTrailing: () => `0% complete`,
            },
            {
                key: "EXTERNAL_PLUGINS",
                title: () => "External Plugins",
                icon: findAssetId("ActivitiesIcon"),
                render: () => import("./pages/Plugins"),
                useTrailing: () => `0% complete`,
            },
            {
                key: "RAIN_THEMES",
                title: () => "Themes",
                icon: findAssetId("PaintPaletteIcon"),
                render: () => import("./pages/Plugins"),
                useTrailing: () => `0% complete`,
            },
            {
                key: "RAIN_FONTS",
                title: () => "Fonts",
                icon: findAssetId("ic_add_text"),
                render: () => import("./pages/Plugins"),
                useTrailing: () => `0% complete`,
            },
            {
                key: "RAIN_DEVELOPER",
                title: () => "Developer",
                icon: findAssetId("WrenchIcon"),
                render: () => import("./pages/Developer"),
                useTrailing: () => `0% complete`,
            },
        ]
    });
}

export interface RowConfig {
    key: string;
    title: () => string;
    onPress?: () => any;
    render?: Parameters<typeof lazy>[0];
    icon?: ImageURISource | number;
    IconComponent?: React.ReactNode,
    usePredicate?: () => boolean,
    useTrailing?: () => string | JSX.Element,
    rawTabsConfig?: Record<string, any>;
}

export const registeredSections = {} as {
    [key: string]: RowConfig[];
};

export function registerSection(section: { name: string; items: RowConfig[]; }) {
    registeredSections[section.name] = section.items;
    return () => delete registeredSections[section.name];
}

/**
 * @internal
 */
export function patchSettings() {
    const unpatches = new Array<() => boolean>;

    patchTabsUI(unpatches);

    return () => unpatches.forEach(u => u());
}

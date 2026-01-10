import React from "react";
import { findAssetId } from "@api/assets";
import { lazy } from "react";
import type { ImageURISource } from "react-native";
import { patchTabsUI } from "./patches/tabs";
import { definePlugin } from "@plugins";
import { RainIcon } from "@assets";
import { isPluginEnabled } from "@plugins";
import { settings } from "@api/settings";
import { useObservable } from "@api/storage";

export default definePlugin({
    name: "Settings",
    description: "injects the settings menu",
    author: [{ name: "cocobo1", id: 767650984175992833n }],
    id: "settings",
    version: "v1.0.0",
    start() {
        initSettings();
    },
    eagerStart() {
        patchSettings();
    },
});

function initSettings() {
    // todo: i18n ALL of settings
    // todo: neaten up the imports
    registerSection({
        name: "Rain",
        items: [
            {
                key: "RAIN",
                title: () => "Rain",
                icon: { uri: RainIcon },
                render: () => import("../../../pages/Rain"),
                useTrailing: () => `10% complete`,
            },
            {
                key: "RAIN_PLUGINS",
                title: () => "Plugins",
                icon: findAssetId("PuzzlePieceIcon"),
                render: () => import("../../../pages/Plugins"),
                useTrailing: () => `60% complete`,
            },
            {
                key: "EXTERNAL_PLUGINS",
                title: () => "External Plugins",
                icon: findAssetId("ActivitiesIcon"),
                render: () => import("../../../pages/ExternalPlugins"),
                useTrailing: () => `20% complete`,
            },
            {
                key: "RAIN_THEMES",
                title: () => "Themes",
                icon: findAssetId("PaintPaletteIcon"),
                render: () => import("../../../pages/Themes"),
                useTrailing: () => `10% complete`,
            },
            {
                key: "RAIN_FONTS",
                title: () => "Fonts",
                icon: findAssetId("LettersIcon"),
                render: () => import("../../../pages/Fonts"),
                useTrailing: () => `40% complete`,
            },
            {
                key: "RAIN_DEVELOPER",
                title: () => "Developer",
                icon: findAssetId("WrenchIcon"),
                render: () => import("../../../pages/Developer"),
                usePredicate: () => {
                    useObservable([settings]);
                    return settings.developerSettings ?? false;
                },
                useTrailing: () => `10% complete`,
            },
        ]
    });

    // compatibility hell lol
    registerSection({
        name: "Kettu",
        items: [
        ]
    });
    registerSection({
        name: "Bunny",
        items: [
        ]
    });
    registerSection({
        name: "Revenge",
        items: [
        ]
    });
    registerSection({
        name: "Vendetta",
        items: [
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
    useTrailing?: () => string | React.ReactNode,
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

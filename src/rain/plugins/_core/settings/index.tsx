import { findAssetId } from "@api/assets";
import { patchAssets } from "@api/assets/patches";
import { useSettings } from "@api/settings";
import { RainIcon } from "@assets";
import { findByPropsLazy } from "@metro";
import { definePlugin, isPluginEnabled, usePluginSettings } from "@plugins";
import { version } from "rain-build-info";
import React from "react";
import { lazy } from "react";
import type { ImageURISource } from "react-native";

import { patchTabsUI } from "./patches/tabs";
import settings from "./settings";

export default definePlugin({
    name: "Settings",
    description: "injects the settings menu",
    author: [{ name: "cocobo1", id: 767650984175992833n }],
    id: "settings",
    version: "v1.0.0",
    start() {
        patchAssets(findByPropsLazy("registerAsset"));
        patchSettings();
        initSettings();
    },
    settings: settings
});

function initSettings() {
    // todo: i18n ALL of settings
    registerSection({
        name: "Rain",
        items: [
            {
                key: "RAIN",
                title: () => "Rain",
                icon: { uri: RainIcon },
                render: () => import("@rain/pages/Rain"),
                useTrailing: () => `(${version})`
            },
            {
                key: "RAIN_PLUGINS",
                title: () => "Plugins",
                icon: findAssetId("PuzzlePieceIcon"),
                render: () => import("@rain/pages/Plugins"),
            },
            {
                key: "RAIN_THEMES",
                title: () => "Themes",
                icon: findAssetId("PaintPaletteIcon"),
                render: () => import("@rain/pages/Themes"),
            },
            {
                key: "RAIN_FONTS",
                title: () => "Fonts",
                icon: findAssetId("LettersIcon"),
                render: () => import("@rain/pages/Fonts"),
            },
            {
                key: "RAIN_DEVELOPER",
                title: () => "Developer",
                icon: findAssetId("WrenchIcon"),
                render: () => import("@rain/pages/Developer"),
                usePredicate: () => {
                    const developerSettings = useSettings(state => state.developerSettings);
                    return developerSettings ?? false;
                },
            },
            {
                key: "RAIN_ASSET_BROWSER",
                title: () => "Asset Browser",
                icon: findAssetId("ImageIcon"),
                render: () => import("@plugins/assetsbrowser/AssetBrowser"),
                usePredicate: () => {
                    const enabled = usePluginSettings((state) => state.settings["assetsbrowser"]?.enabled);
                    return enabled;
                }
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
    useTrailing?: () => string | React.ReactNode,
    rawTabsConfig?: Record<string, any>;
}

export const registeredSections = {} as {
    [key: string]: RowConfig[];
};

export function registerSection(section: { name: string; items: RowConfig[]; }) {
    const existing = registeredSections[section.name] || [];
    registeredSections[section.name] = [...existing, ...section.items];
    return () => {
        registeredSections[section.name] = registeredSections[section.name]?.filter(
            item => !section.items.some(newItem => newItem.key === item.key)
        ) || [];
    };
}

/**
 * @internal
 */
export function patchSettings() {
    const unpatches = new Array<() => boolean>;
    patchTabsUI(unpatches);
    return () => unpatches.forEach(u => u());
}

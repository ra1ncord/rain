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
                key: "EXTERNAL_PLUGINS",
                title: () => "External Plugins",
                icon: findAssetId("AppsIcon"),
                render: () => import("@rain/pages/ExternalPlugins"),
                usePredicate: () => {
                    const isEnabled = usePluginSettings(state => state.settings.traveller?.enabled);
                    return isEnabled ?? isPluginEnabled("traveller");
                }
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

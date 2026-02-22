import { findAssetId } from "@api/assets";
import { patchAssets } from "@api/assets/patches";
import { useSettings } from "@api/settings";
import { RainIcon } from "@assets";
import { findByPropsLazy } from "@metro";
import { definePlugin } from "@plugins";
import { version } from "rain-build-info";
import { Strings } from "@rain/i18n";
import React, { lazy } from "react";
import type { ImageURISource } from "react-native";

import { patchTabsUI } from "./patches/tabs";
import settings from "./settings";

export default definePlugin({
    name: Strings.PLUGIN__CORE_SETTINGS,
    description: Strings.PLUGIN__CORE_SETTINGS_DESC,
    author: [{ name: "cocobo1", id: 767650984175992833n }],
    id: "settings",
    version: "1.0.0",
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
                title: () => Strings.RAIN,
                icon: { uri: RainIcon },
                render: () => import("@rain/pages/Rain"),
                useTrailing: () => `(${version})`
            },
            {
                key: "RAIN_PLUGINS",
                title: () => Strings.PLUGINS,
                icon: findAssetId("PuzzlePieceIcon"),
                render: () => import("@rain/pages/Plugins"),
            },
            {
                key: "RAIN_THEMES",
                title: () => Strings.THEMES,
                icon: findAssetId("PaintPaletteIcon"),
                render: () => import("@rain/pages/Themes"),
            },
            {
                key: "RAIN_FONTS",
                title: () => Strings.FONTS,
                icon: findAssetId("LettersIcon"),
                render: () => import("@rain/pages/Fonts"),
            },
            {
                key: "RAIN_DEVELOPER",
                title: () => Strings.DEVELOPER,
                icon: findAssetId("WrenchIcon"),
                render: () => import("@rain/pages/Developer"),
                usePredicate: () => {
                    const developerSettings = useSettings(state => state.developerSettings);
                    return developerSettings ?? false;
                },
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

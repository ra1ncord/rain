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
    
    registerSection({
        name: "rain",
        items: [
            {
                key: "RAIN",
                title: () => "rain",
                icon: findAssetId("RobotIcon"),
                render: () => import("./pages/rain")
            }
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

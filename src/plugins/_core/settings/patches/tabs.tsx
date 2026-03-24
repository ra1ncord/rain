import { after } from "@api/patcher";
import { useSettings } from "@api/settings";
import { TableRow } from "@metro/common/components";
import { findByPropsLazy } from "@metro/wrappers";
import React from "react";
import { Strings } from "@rain/i18n";

import { registeredSections } from "..";
import { CustomPageRenderer, wrapOnPress } from "./shared";

const settingConstants = findByPropsLazy("SETTING_RENDERER_CONFIG");
const createListModule = findByPropsLazy("createList");

export function patchTabsUI(unpatches: (() => void | boolean)[]) {
    const getRows = () => Object.values(registeredSections)
        .flatMap(sect => sect.map(row => ({
            [row.key]: {
                type: "pressable",
                title: row.title,
                icon: row.icon,
                IconComponent: () => <TableRow.Icon source={row.icon} />,
                usePredicate: row.usePredicate,
                useTrailing: row.useTrailing,
                onPress: wrapOnPress(row.onPress, null, row.render, row.title()),
                withArrow: true,
                ...row.rawTabsConfig
            }
        })))
        .reduce((a, c) => Object.assign(a, c));

    const origRendererConfig = settingConstants.SETTING_RENDERER_CONFIG;
    let rendererConfigValue = settingConstants.SETTING_RENDERER_CONFIG;

    Object.defineProperty(settingConstants, "SETTING_RENDERER_CONFIG", {
        enumerable: true,
        configurable: true,
        get: () => ({
            ...rendererConfigValue,
            RAIN_CUSTOM_PAGE: {
                type: "route",
                title: () => {Strings.GENERAL.CORE.RAIN},
                screen: {
                    route: "RAIN_CUSTOM_PAGE",
                    getComponent: () => CustomPageRenderer
                }
            },
            ...getRows()
        }),
        set: v => rendererConfigValue = v,
    });

    unpatches.push(() => {
        Object.defineProperty(settingConstants, "SETTING_RENDERER_CONFIG", {
            value: origRendererConfig,
            writable: true,
            get: undefined,
            set: undefined
        });
    });

    unpatches.push(after("createList", createListModule, function(args, ret) {
        const [config] = args;
        const currentPosition = useSettings.getState().settingsPosition;

        if (config?.sections && Array.isArray(config.sections)) {
            const { sections } = config;

            const isMainSettingsPage = sections.some((s: any) => s.settings?.includes("ACCOUNT"));
            if (!isMainSettingsPage) return ret;

            let insertIndex: number;

            if (currentPosition === "TOP") {
                insertIndex = 0;
            } else {
                const targetSectionIndex = sections.findIndex((i: any) => i.settings?.includes(currentPosition));
                if (targetSectionIndex === -1) return ret;
                insertIndex = targetSectionIndex + 1;
            }

            Object.keys(registeredSections).forEach(sect => {
                const alreadyExists = sections.some((s: any) => s.label === sect);
                if (!alreadyExists) {
                    sections.splice(insertIndex++, 0, {
                        label: sect,
                        title: sect,
                        settings: registeredSections[sect].map(a => a.key)
                    });
                }
            });
        }
        return ret;
    },));

}

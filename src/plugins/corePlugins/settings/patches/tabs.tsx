import { after } from "spitroast";
import { findInReactTree } from "@lib/utils";
import { findByNameLazy, findByPropsLazy } from "@metro";
import { registeredSections } from "../settings";

import { CustomPageRenderer, wrapOnPress } from "./shared";
import { TableRow } from "@metro/common";

const settingConstants = findByPropsLazy("SETTING_RENDERER_CONFIG");
const SettingsOverviewScreen = findByNameLazy("SettingsOverviewScreen", false);

function useIsFirstRender() {
    let firstRender = false;
    React.useEffect(() => void (firstRender = true), []);
    return firstRender;
}

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
                title: () => "rain",
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

    unpatches.push(after("default", SettingsOverviewScreen, (_, ret) => {
        if (useIsFirstRender()) return; // :shrug:

        const { sections } = findInReactTree(ret, i => i.props?.sections).props;
        // Credit to @palmdevs - https://discord.com/channels/1196075698301968455/1243605828783571024/1307940348378742816
        let index = -~sections.findIndex((i: any) => i.settings.includes("ACCOUNT")) || 1;

        Object.keys(registeredSections).forEach(sect => {
            sections.splice(index++, 0, {
                label: sect,
                title: sect,
                settings: registeredSections[sect].map(a => a.key)
            });
        });
    }));
}

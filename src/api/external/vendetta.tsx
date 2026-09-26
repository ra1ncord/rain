import * as assets from "@api/assets";
import * as commands from "@api/commands";
import * as debug from "@api/debug";
import { getLoaderIdentity } from "@api/native/loader";
import { after, before, instead } from "@api/patcher";
import { loaderConfig, settings } from "@api/settings";
import * as alerts from "@api/ui/alerts";
import { Codeblock, ErrorBoundary, Search, Summary } from "@api/ui/components";
import * as color from "@api/ui/components/color";
import { showToast } from "@api/ui/toasts";
import * as utils from "@lib/utils";
import { cyrb64Hash } from "@lib/utils/cyrb64";
import { LoggerClass } from "@lib/utils/logger";
import * as metro from "@metro";
import * as common from "@metro/common";
import * as components from "@metro/common/components";
import * as themes from "@plugins/_core/painter/themes";
import { omit } from "es-toolkit";
import { StyleSheet } from "react-native";

import * as storage from "./storage";

function createThemedStyleSheet<T extends Record<string, any>>(sheet: T): T {
    for (const key in sheet) {
        sheet[key] = new Proxy(StyleSheet.flatten(sheet[key]), {
            get(target, prop, receiver) {
                const res = Reflect.get(target, prop, receiver);
                return color.isSemanticColor(res) ? color.resolveSemanticColor(res) : res;
            },
        }) as any;
    }
    return sheet;
}

let vendettaObject: any;

export function getVendettaObject() {
    if (vendettaObject) return vendettaObject;

    const createStackBasedFilter = (fn: any) => (filter: (m: any) => boolean) =>
        fn(metro.factories.createSimpleFilter(filter, cyrb64Hash(new Error().stack!)));

    vendettaObject = window.vendetta = {
        patcher: { before, after, instead },
        metro: {
            modules: (window as any).modules,
            find: createStackBasedFilter(metro.findExports),
            findAll: createStackBasedFilter(metro.findAllExports),
            findByProps: (...props: string[]) => metro.findByProps(...props),
            findByPropsAll: (...props: string[]) => metro.findByPropsAll(...props),
            findByName: (name: string, defaultExp = true) => metro.findByName(name, defaultExp),
            findByNameAll: (name: string, defaultExp = true) => metro.findByNameAll(name, defaultExp),
            findByDisplayName: (name: string, defaultExp = true) => metro.findByDisplayName(name, defaultExp),
            findByDisplayNameAll: (name: string, defaultExp = true) => metro.findByDisplayNameAll(name, defaultExp),
            findByTypeName: (name: string, defaultExp = true) => metro.findByTypeName(name, defaultExp),
            findByTypeNameAll: (name: string, defaultExp = true) => metro.findByTypeNameAll(name, defaultExp),
            findByStoreName: (name: string) => metro.findByStoreName(name),
            common: {
                constants: common.constants,
                channels: common.channels,
                i18n: common.i18n,
                url: common.url,
                toasts: common.toasts,
                stylesheet: { createThemedStyleSheet },
                clipboard: common.clipboard,
                assets: common.assets,
                invites: common.invites,
                commands: common.commands,
                navigation: common.navigation,
                navigationStack: common.navigationStack,
                NavigationNative: common.NavigationNative,
                Flux: common.Flux,
                FluxDispatcher: common.FluxDispatcher,
                React: common.React,
                ReactNative: common.ReactNative,
                moment: require("moment"),
                chroma: require("chroma-js"),
                lodash: require("lodash"),
                util: require("util"),
            },
        },
        constants: {
            DISCORD_SERVER: "https://discord.gg/6cN7wKa8gp",
            GITHUB: "https://github.com/ra1ncord/rain",
            PROXY_PREFIX: "https://vd-plugins.github.io/proxy",
            HTTP_REGEX: /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/,
            HTTP_REGEX_MULTI: /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)/g,
        },
        utils: {
            findInReactTree: (tree: any, filter: any) => utils.findInReactTree(tree, filter),
            findInTree: (tree: any, filter: any, options: any) => utils.findInTree(tree, filter, options),
            safeFetch: (input: any, options?: any, timeout?: number) => utils.safeFetch(input, options, timeout),
            unfreeze: (obj: object) => Object.isFrozen(obj) ? ({ ...obj }) : obj,
            without: (object: any, ...keys: any[]) => omit(object, keys),
        },
        debug: {
            connectToDebugger: (url: string) => debug.connectToDebugger(url),
            getDebugInfo: () => debug.getDebugInfo(),
        },
        ui: {
            components: {
                Forms: components.Forms,
                General: common.ReactNative,
                Alert: components.LegacyAlert,
                Button: components.CompatButton,
                HelpMessage: (props: any) => <components.HelpMessage {...props} />,
                SafeAreaView: (props: any) => <components.SafeAreaView {...props} />,
                Summary,
                ErrorBoundary,
                Codeblock,
                Search,
            },
            toasts: {
                showToast: (content: string, asset?: number) => showToast(content, asset),
            },
            alerts: {
                showConfirmationAlert: (options: any) => alerts.showConfirmationAlert(options),
                showCustomAlert: (component: any, props: any) => alerts.showCustomAlert(component, props),
                showInputAlert: (options: any) => alerts.showInputAlert(options),
            },
            assets: {
                all: new Proxy<any>({}, {
                    get(cache, p) {
                        if (typeof p !== "string") return undefined;
                        if (cache[p]) return cache[p];
                        const found = assets.findAsset(p);
                        if (found) cache[p] = found;
                        return found;
                    },
                    ownKeys(cache) {
                        const keys = new Set<string>();
                        for (const asset of assets.iterateAssets()) {
                            cache[asset.name] = asset;
                            keys.add(asset.name);
                        }
                        return [...keys];
                    },
                }),
                find: (filter: (a: any) => boolean) => assets.findAsset(filter),
                getAssetByName: (name: string) => assets.findAsset(name),
                getAssetByID: (id: number) => assets.findAsset(id),
                getAssetIDByName: (name: string) => assets.findAssetId(name),
            },
            semanticColors: color.semanticColors,
            rawColors: color.rawColors,
        },
        plugins: {},
        themes: {
            themes: themes.themes,
            fetchTheme: (id: string, selected?: boolean) => themes.fetchTheme(id, selected),
            installTheme: (id: string) => themes.installTheme(id),
            selectTheme: (id: string) => themes.selectTheme(id === "default" ? null : themes.themes[id]),
            removeTheme: (id: string) => themes.removeTheme(id),
            getCurrentTheme: () => themes.getCurrentTheme(),
            updateThemes: () => themes.updateThemes(),
        },
        commands: {
            registerCommand: (cmd: any) => commands.registerCommand(cmd),
        },
        storage: {
            createProxy: (target: any) => storage.createProxy(target),
            useProxy: (s: any) => storage.useProxy(s),
            createStorage: (backend: any) => storage.createStorage(backend),
            wrapSync: (store: any) => storage.wrapSync(store),
            awaitSyncWrapper: (store: any) => storage.awaitStorage(store),
            createMMKVBackend: (store: string) => storage.createMMKVBackend(store),
            createFileBackend: (file: string) => storage.createFileBackend(file),
        },
        settings: new Proxy({}, {
            get: (_, p: string) => (settings() as any)[p],
        }),
        loader: {
            identity: getLoaderIdentity() ?? undefined,
            config: new Proxy({}, {
                get: (_, p: string) => (loaderConfig() as any)[p],
            }),
        },
        logger: new LoggerClass("Rain » Vendetta"),
        version: debug.versionHash,
        unload: () => {
            delete window.vendetta;
            vendettaObject = undefined;
        },
    };

    return vendettaObject;
}

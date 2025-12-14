import * as alerts from "@lib/ui/alerts";
import * as storage from "@lib/api/storage";
import { createStorage } from "@lib/api/storage";
import * as assets from "@lib/api/assets";
import * as commands from "@plugins/_core/commands";
import * as debug from "@lib/api/debug";
import patcher from "@lib/api/patcher";
import { loaderConfig, settings } from "@lib/api/settings";
import * as utils from "@lib/utils";
import { cyrb64Hash } from "@lib/utils/cyrb64";
import { LoggerClass } from "@lib/utils/logger";
import * as metro from "@metro";
import * as common from "@metro/common";
import { Forms } from "@metro/common/components";
import * as commonComponents from "@metro/common/components";
import * as color from "@lib/ui/components/color";
import * as components from "@ui/components";
import { createThemedStyleSheet } from "@lib/ui/styles";
import * as toasts from "@lib/ui/toasts";
import { omit } from "es-toolkit";
import { createElement, useEffect } from "react";
import { View } from "react-native";
import { Observable } from "@gullerya/object-observer";

import { VdPluginManager, VendettaPlugin } from "./";
import { getLoaderIdentity } from "@lib/api/native/loader";

export async function createVdPluginObject(plugin: VendettaPlugin) {
    return {
        ...window.vendetta,
        plugin: {
            id: plugin.id,
            manifest: plugin.manifest,
            storage: createStorage<Record<string, any>>(plugin.id, { dflt: {} }),
        },
        logger: new LoggerClass(`Rain » ${plugin.manifest.name}`),
    };
}

export const initVendettaObject = (): any => {
    // pitfall: this assumes the returning module(s) are the same within the same location
    // find(m => m.render?.name === "ActionSheet") - would work fine
    // ["trackThis", "trackThat"].forEach(p => find(m => m[p])) - would not
    const createStackBasedFilter = (fn: any) => {
        return (filter: (m: any) => boolean) => {
            return fn(metro.factories.createSimpleFilter(filter, cyrb64Hash(new Error().stack!)));
        };
    };

    const createLegacyProxy = (target: any = {}) => {
        const observable = Observable.from(target);
        return {
            proxy: observable,
            emitter: {
                on: () => {},
                off: () => {},
                emit: () => {}
            }
        };
    };

    const legacyUseProxy = (storageProxy: any) => {
        storage.useObservable([storageProxy]);
    };

    const legacyCreateStorage = async (backend: any) => {
        let storageName = "legacy-storage";
        if (typeof backend?.get === "function") {
            try {
                const data = await backend.get();
                if (data && typeof data === "object") {
                    return createStorage(storageName, { dflt: data });
                }
            } catch {
            }
        }
        return createStorage(storageName, { dflt: {} });
    };

    const legacyWrapSync = (store: any) => {
        if (store instanceof Promise) {
            let resolved: any;
            store.then(s => resolved = s);
            return new Proxy({}, {
                get: (_, prop) => {
                    if (resolved) return resolved[prop];
                    throw new Error("Storage not yet initialized");
                }
            });
        }
        return store;
    };

    const legacyCreateMMKVBackend = (storeName: string) => {
        const storage = createStorage(storeName, { dflt: {} });
        return {
            get: async () => storage,
            set: async (data: any) => Object.assign(storage, data)
        };
    };

    const legacyCreateFileBackend = (fileName: string) => {
        const storage = createStorage(fileName, { dflt: {} });
        return {
            get: async () => storage,
            set: async (data: any) => Object.assign(storage, data)
        };
    };

    const api = window.vendetta = {
        patcher: {
            before: patcher.before,
            after: patcher.after,
            instead: patcher.instead
        },
        metro: {
            modules: window.modules,
            find: createStackBasedFilter(metro.findExports),
            findAll: createStackBasedFilter(metro.findAllExports),
            findByProps: (...props: any[]) => {
                // TODO: remove this hack to fix Decor
                if (props.length === 1 && props[0] === "KeyboardAwareScrollView") {
                    props.push("listenToKeyboardEvents");
                }

                const ret = metro.findByProps(...props);
                if (ret == null) {
                    if (props.includes("ActionSheetTitleHeader")) {
                        const module = metro.findByProps("ActionSheetRow");

                        // returning a fake object probably wouldn't cause an issue,
                        // since the original object are full of getters anyway
                        return {
                            ...module,
                            ActionSheetTitleHeader: module.BottomSheetTitleHeader,
                            ActionSheetContentContainer: ({ children }: any) => {
                                useEffect(() => console.warn("Discord has removed 'ActionSheetContentContainer', please move into something else. This has been temporarily replaced with View"), []);
                                return createElement(View, null, children);
                            }
                        };
                    }
                }

                return ret;
            },
            findByPropsAll: (...props: any) => metro.findByPropsAll(...props),
            findByName: (name: string, defaultExp?: boolean | undefined) => {
                // TODO: remove this hack to fix Decor
                if (name === "create" && typeof defaultExp === "undefined") {
                    return metro.findByName("create", false).default;
                }

                return metro.findByName(name, defaultExp ?? true);
            },
            findByNameAll: (name: string, defaultExp: boolean = true) => metro.findByNameAll(name, defaultExp),
            findByDisplayName: (displayName: string, defaultExp: boolean = true) => metro.findByDisplayName(displayName, defaultExp),
            findByDisplayNameAll: (displayName: string, defaultExp: boolean = true) => metro.findByDisplayNameAll(displayName, defaultExp),
            findByTypeName: (typeName: string, defaultExp: boolean = true) => metro.findByTypeName(typeName, defaultExp),
            findByTypeNameAll: (typeName: string, defaultExp: boolean = true) => metro.findByTypeNameAll(typeName, defaultExp),
            findByStoreName: (name: string) => metro.findByStoreName(name),
            common: {
                constants: common.constants,
                channels: common.channels,
                i18n: common.i18n,
                url: common.url,
                toasts: common.toasts,
                stylesheet: {
                    createThemedStyleSheet
                },
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
                util: require("util")
            }
        },
        constants: {
            DISCORD_SERVER: "https://discord.gg/n9QQ4XhhJP",
            GITHUB: "https://github.com/vendetta-mod",
            PROXY_PREFIX: "https://vd-plugins.github.io/proxy",
            HTTP_REGEX: /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/,
            HTTP_REGEX_MULTI: /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)/g,
            DISCORD_SERVER_ID: "1015931589865246730",
            PLUGINS_CHANNEL_ID: "1091880384561684561",
            THEMES_CHANNEL_ID: "1091880434939482202",
        },
        utils: {
            findInReactTree: (tree: { [key: string]: any; }, filter: any) => utils.findInReactTree(tree, filter),
            findInTree: (tree: any, filter: any, options: any) => utils.findInTree(tree, filter, options),
            safeFetch: (input: RequestInfo | URL, options?: RequestInit | undefined, timeout?: number | undefined) => utils.safeFetch(input, options, timeout),
            unfreeze: (obj: object) => Object.isFrozen(obj) ? ({ ...obj }) : obj,
            without: (object: any, ...keys: any) => omit(object, keys)
        },
        debug: {
            connectToDebugger: (url: string) => debug.connectToDebugger(url),
            getDebugInfo: () => debug.getDebugInfo()
        },
        ui: {
            components: {
                Forms,
                General: common.ReactNative,
                Alert: commonComponents.LegacyAlert,
                Button: commonComponents.CompatButton,
                HelpMessage: (...props: any[]) => <commonComponents.HelpMessage {...props} />,
                SafeAreaView: (...props: any[]) => <commonComponents.SafeAreaView {...props} />,
                Summary: components.Summary,
                ErrorBoundary: components.ErrorBoundary,
                Codeblock: components.Codeblock,
                Search: components.Search
            },
            toasts: {
                showToast: (content: string, asset?: number) => toasts.showToast(content, asset)
            },
            alerts: {
                showConfirmationAlert: (options: any) => alerts.showConfirmationAlert(options),
                showCustomAlert: (component: React.ComponentType<any>, props: any) => alerts.showCustomAlert(component, props),
                showInputAlert: (options: any) => alerts.showInputAlert(options)
            },
            assets: {
                all: new Proxy<any>({}, {
                    get(cache, p) {
                        if (typeof p !== "string") return undefined;
                        if (cache[p]) return cache[p];

                        for (const asset of assets.iterateAssets()) {
                            if (asset.name) return cache[p] = asset;
                        }
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
                getAssetIDByName: (name: string) => assets.findAssetId(name)
            },
            semanticColors: color.semanticColors,
            rawColors: color.rawColors
        },
        plugins: {
            plugins: VdPluginManager.plugins,
            fetchPlugin: (source: string) => VdPluginManager.fetchPlugin(source),
            installPlugin: (source: string, enabled = true) => VdPluginManager.installPlugin(source, enabled),
            startPlugin: (id: string) => VdPluginManager.startPlugin(id),
            stopPlugin: (id: string, disable = true) => VdPluginManager.stopPlugin(id, disable),
            removePlugin: (id: string) => VdPluginManager.removePlugin(id),
            getSettings: (id: string) => VdPluginManager.getSettings(id)
        },
        //themes: {
        //    themes: themes.themes,
        //    fetchTheme: (id: string, selected?: boolean) => themes.fetchTheme(id, selected),
        //    installTheme: (id: string) => themes.installTheme(id),
        //    selectTheme: (id: string) => themes.selectTheme(id === "default" ? null : themes.themes[id]),
        //    removeTheme: (id: string) => themes.removeTheme(id),
        //    getCurrentTheme: () => themes.getThemeFromLoader(),
        //    updateThemes: () => themes.updateThemes()
        //},
        commands: {
            registerCommand: commands.registerCommand
        },
        storage: {
            createProxy: createLegacyProxy,
            useProxy: legacyUseProxy,
            createStorage: legacyCreateStorage,
            wrapSync: legacyWrapSync,
            awaitSyncWrapper: (store: any) => storage.awaitStorage(store),
            createMMKVBackend: legacyCreateMMKVBackend,
            createFileBackend: legacyCreateFileBackend
        },
        settings,
        loader: {
            identity: getLoaderIdentity() ?? void 0,
            config: loaderConfig,
        },
        logger: {
            log: (...message: any) => console.log(...message),
            info: (...message: any) => console.info(...message),
            warn: (...message: any) => console.warn(...message),
            error: (...message: any) => console.error(...message),
            time: (...message: any) => console.time(...message),
            trace: (...message: any) => console.trace(...message),
            verbose: (...message: any) => console.log(...message)
        },
        version: debug.versionHash,
        unload: () => {
            delete window.vendetta;
        },
    };

    return () => api.unload();
};
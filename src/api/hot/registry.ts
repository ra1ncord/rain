import * as assets from "@api/assets";
import * as commands from "@api/commands";
import * as commandTypes from "@api/commands/types";
import * as externalPlugins from "@api/external/plugins";
import * as hotBuild from "@api/hot/build";
import * as nativeModules from "@api/native/modules";
import * as nativeUpdate from "@api/native/modules/update";
import * as patcher from "@api/patcher";
import * as reactJsx from "@api/react/jsx";
import * as settings from "@api/settings";
import * as storage from "@api/storage";
import * as alerts from "@api/ui/alerts";
import * as settingsTextInput from "@api/ui/components/SettingsTextInput";
import * as sheets from "@api/ui/sheets";
import * as toasts from "@api/ui/toasts";
import * as cyrb64 from "@lib/utils/cyrb64";
import * as logger from "@lib/utils/logger";
import * as metro from "@metro";
import * as metroCommon from "@metro/common";
import * as metroComponents from "@metro/common/components";
import * as metroStores from "@metro/common/stores";
import * as plugins from "@plugins";
import * as themes from "@plugins/_core/painter/themes";
import * as jsxRuntime from "react/jsx-runtime";

import { getProxyFactory } from "@lib/utils/lazy";

const deps = require("!rain-deps-shim!");
const real = (v: any) => getProxyFactory(v)?.() ?? v;

const table: Record<string, any> = {
    "@api/commands": commands,
    "@api/commands/types": commandTypes,
    "@api/assets": assets,
    "@api/external/plugins": externalPlugins,
    "@api/hot/build": hotBuild,
    "@api/native/modules": nativeModules,
    "@api/native/modules/update": nativeUpdate,
    "@api/patcher": patcher,
    "@api/react/jsx": reactJsx,
    "@api/settings": settings,
    "@api/storage": storage,
    "@api/ui/alerts": alerts,
    "@api/ui/components/SettingsTextInput": settingsTextInput,
    "@api/ui/sheets": sheets,
    "@api/ui/toasts": toasts,
    "@lib/utils/cyrb64": cyrb64,
    "@lib/utils/logger": logger,
    "@metro": metro,
    "@metro/common": metroCommon,
    "@metro/common/components": metroComponents,
    "@metro/common/stores": metroStores,
    "@plugins": plugins,
    "@plugins/_core/painter/themes": themes,
    "react/jsx-runtime": jsxRuntime,
    "react": { get: () => real(deps.react) },
    "react-native": { get: () => real(deps["react-native"]) },
};

const wrapped = new Map<string, any>();

function wrap(id: string) {
    const entry = table[id];
    if (!entry) throw new Error(`rain module ${id} is not shared`);
    if (typeof entry.get === "function" && Object.keys(entry).length === 1) {
        const value = entry.get();
        return value;
    }
    return new Proxy(entry, {
        get: (t, k) => (k === "__esModule" ? true : t[k]),
        has: (t, k) => k === "__esModule" || k in t,
    });
}

export function installRegistry() {
    (globalThis as any).__rainRequire = (id: string) => {
        let m = wrapped.get(id);
        if (!m) {
            m = wrap(id);
            wrapped.set(id, m);
        }
        return m;
    };
}

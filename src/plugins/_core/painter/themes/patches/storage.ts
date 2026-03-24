import { after, before } from "@api/patcher";
import { findInTree } from "@lib/utils";
import { proxyLazy } from "@lib/utils/lazy";
import { findByProps } from "@metro";

import { _colorRef } from "../updater";

const mmkvStorage = proxyLazy(() => {
    const newModule = findByProps("impl");
    if (typeof newModule?.impl === "object") return newModule.impl;
    return findByProps("storage");
});

export default function patchStorage() {
    const patchedKeys = new Set(["ThemeStore", "SelectivelySyncedUserSettingsStore"]);

    const patches = [
        after("get", mmkvStorage, ([key], ret) => {
            if (!_colorRef.current || !patchedKeys.has(key)) return;

            const state = findInTree(ret._state, s => typeof s.theme === "string");
            if (state) state.theme = _colorRef.key;
        }),
        before("set", mmkvStorage, ([key, value]) => {
            if (!patchedKeys.has(key) || !value) return;
        
            try {
                if (value._state && value._state.theme) {
                    const lastTheme = _colorRef.lastSetDiscordTheme || "darker";
                    if (value._state.theme.startsWith("rain-theme-")) {
                        value._state.theme = lastTheme;
                    }
                }
            } catch (err) {
            }

            return [key, value];
        })
    ];

    return () => patches.forEach(p => p());
}

import { writeFile } from "@api/native/fs";
import { getStoredTheme, getThemeFilePath, isPyonLoader } from "@api/native/loader";
import { useSettings } from "@api/settings";
import { createFileStorage } from "@api/storage";
import { safeFetch } from "@lib/utils";
import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

import initColors from "./colors";
import { applyAndroidAlphaKeys, normalizeToHex } from "./parser";
import { waitForColorsPrefHydration } from "./preferences";
import { ThemeManifest } from "./types";
import { updateColor } from "./updater";

export interface ThemeInfo {
    id: string;
    selected: boolean;
    data: ThemeManifest;
}

interface ThemesStore {
    themes: Record<string, ThemeInfo>;
    setTheme: (id: string, theme: ThemeInfo) => void;
    removeTheme: (id: string) => Promise<boolean>;
    selectTheme: (id: string | null, write?: boolean) => Promise<void>;
    fetchTheme: (url: string, selected?: boolean) => Promise<void>;
    hotFetchTheme: (url: string, selected?: boolean) => Promise<void>;
    installTheme: (url: string) => Promise<void>;
    updateThemes: () => Promise<void>;
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
}

/**
 * @internal
 */
export async function writeThemeToNative(theme: ThemeInfo | {}) {
    if (typeof theme !== "object") throw new Error("Theme must be an object");

    const themePath = getThemeFilePath() || "theme.json";
    await writeFile(themePath, JSON.stringify(theme));
}

// Process data for some compatiblity with native side
function processData(data: ThemeManifest) {
    if (data.semanticColors) {
        const { semanticColors } = data;

        for (const key in semanticColors) {
            for (const index in semanticColors[key]) {
                semanticColors[key][index] &&= normalizeToHex(semanticColors[key][index] as string) || false;
            }
        }
    }

    if (data.rawColors) {
        const { rawColors } = data;

        for (const key in rawColors) {
            const normalized = normalizeToHex(rawColors[key]);
            if (normalized) data.rawColors[key] = normalized;
        }

        if (Platform.OS === "android") applyAndroidAlphaKeys(rawColors);
    }

    if (data.spec === undefined) {
        if (!("theme_color_map" in data)) {
            data.spec = 2;
        }
    }

    return data;
}

function validateTheme(themeJSON: any): boolean {
    if (typeof themeJSON !== "object" || themeJSON === null) return false;

    if (themeJSON.spec === 3 && !themeJSON.main) return false;

    if (themeJSON.spec === 2) return true;

    if (themeJSON.theme_color_map) return true;

    return themeJSON.spec === 2 || themeJSON.spec === 3;
}

export const useThemes = create<ThemesStore>()(
    persist(
        (set, get) => ({
            themes: {},
            _hasHydrated: false,
            setTheme: (id: string, theme: ThemeInfo) => {
                set(state => ({
                    themes: {
                        ...state.themes,
                        [id]: theme
                    }
                }));
            },
            removeTheme: async (id: string) => {
                const theme = get().themes[id];
                if (theme?.selected) await get().selectTheme(null);

                set(state => {
                    const newThemes = { ...state.themes };
                    delete newThemes[id];
                    return { themes: newThemes };
                });

                return theme?.selected ?? false;
            },
            selectTheme: async (id: string | null, write = true) => {
                const { themes } = get();
                const theme = id ? themes[id] : null;

                set(state => {
                    const newThemes = { ...state.themes };
                    Object.keys(newThemes).forEach(k => {
                        newThemes[k] = {
                            ...newThemes[k],
                            selected: newThemes[k].id === id
                        };
                    });
                    return { themes: newThemes };
                });

                if (theme == null && write) {
                    updateColor(null, { update: true }, { noCustomIcons: false });
                    return await writeThemeToNative({});
                } else if (theme) {
                    updateColor(theme.data, { update: true }, { noCustomIcons: false });
                    return await writeThemeToNative(theme);
                }
            },
            fetchTheme: async (url: string, selected = false) => {
                let themeJSON: any;

                try {
                    themeJSON = await (await safeFetch(url, { cache: "no-store" })).json();
                } catch {
                    throw new Error(`Failed to fetch theme at ${url}`);
                }

                if (!validateTheme(themeJSON)) throw new Error(`Invalid theme at ${url}`);

                const themeInfo: ThemeInfo = {
                    id: url,
                    selected: selected,
                    data: processData(themeJSON),
                };

                get().setTheme(url, themeInfo);

                if (selected) {
                    writeThemeToNative(themeInfo);
                    updateColor(themeInfo.data, { update: true }, { noCustomIcons: false });
                }
            },
            hotFetchTheme: async (url: string, selected = false) => {
                let themeJSON: any;

                try {
                    themeJSON = await (await safeFetch(url, { cache: "no-store" })).json();
                } catch {
                    throw new Error(`Failed to fetch theme at ${url}`);
                }

                if (!validateTheme(themeJSON)) throw new Error(`Invalid theme at ${url}`);

                const themeInfo: ThemeInfo = {
                    id: url,
                    selected: selected,
                    data: processData(themeJSON),
                };

                get().setTheme(url, themeInfo);

                if (selected) {
                    writeThemeToNative(themeInfo);
                    updateColor(themeInfo.data, { update: true }, { noCustomIcons: true });
                }
            },
            installTheme: async (url: string) => {
                const { themes } = get();
                if (typeof url !== "string" || url in themes) throw new Error("Theme already installed");
                await get().fetchTheme(url);
            },
            updateThemes: async () => {
                const currentTheme = getCurrentTheme();
                const { themes } = get();
                await Promise.allSettled(
                    Object.keys(themes).map(id => get().fetchTheme(id, currentTheme?.id === id))
                );
            },
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "vendetta-themes",
            storage: createJSONStorage(() => createFileStorage("VENDETTA_THEMES")),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            }
        }
    )
);

export const themes = new Proxy({} as Record<string, ThemeInfo>, {
    get(target, prop: string) {
        return useThemes.getState().themes[prop];
    },
    set(target, prop: string, value: ThemeInfo) {
        useThemes.getState().setTheme(prop, value);
        return true;
    },
    deleteProperty(target, prop: string) {
        useThemes.getState().removeTheme(prop);
        return true;
    },
    has(target, prop: string) {
        return prop in useThemes.getState().themes;
    },
    ownKeys(target) {
        return Object.keys(useThemes.getState().themes);
    },
    getOwnPropertyDescriptor(target, prop) {
        const { themes } = useThemes.getState();
        if (prop in themes) {
            return {
                enumerable: true,
                configurable: true,
            };
        }
    }
});

export async function fetchTheme(url: string, selected = false) {
    return useThemes.getState().fetchTheme(url, selected);
}

export async function installTheme(url: string) {
    return useThemes.getState().installTheme(url);
}

export async function selectTheme(theme: ThemeInfo | null, write = true) {
    return useThemes.getState().selectTheme(theme?.id ?? null, write);
}

export async function removeTheme(id: string) {
    return useThemes.getState().removeTheme(id);
}

export async function updateThemes() {
    return useThemes.getState().updateThemes();
}

export function getCurrentTheme() {
    return Object.values(useThemes.getState().themes).find(t => t.selected) ?? null;
}

/**
 * @internal
 */
export function getThemeFromLoader(): ThemeInfo | null {
    return getStoredTheme();
}

export async function waitForThemesHydration(): Promise<void> {
    return new Promise(resolve => {
        if (useThemes.getState()._hasHydrated) {
            resolve();
            return;
        }

        const unsubscribe = useThemes.subscribe(
            state => {
                if (state._hasHydrated) {
                    unsubscribe();
                    resolve();
                }
            }
        );

        setTimeout(() => {
            unsubscribe();
            resolve();
        }, 5000);
    });
}

/**
 * @internal
 */
export async function initThemes() {
    const settings = useSettings.getState();
    if (settings.safeMode) return;

    try {
        if (isPyonLoader()) {
            writeFile("../vendetta_theme.json", "null");
        }

        await waitForColorsPrefHydration();
        await waitForThemesHydration();
        await getCurrentTheme();

        const currentTheme = getCurrentTheme();
        initColors(currentTheme?.data ?? null);

        if (currentTheme) {
            updateColor(currentTheme.data, { update: true }, { noCustomIcons: false });
        }

        updateThemes().catch(e => console.error("Failed to update themes", e));

    } catch (e) {
        console.error("Failed to initialize themes", e);
    }
}

export { getStoredTheme };

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { fileExists, readFile, writeFile, clearFolder, downloadFile, removeFile } from "@api/native/fs";
import { safeFetch } from "@lib/utils";

type FontMap = Record<string, string>;

export type FontDefinition = {
    type?: string;
    spec?: 1;
    name: string;
    description?: string;
    main: FontMap;
    source?: string;
};

type FontStorage = Record<string, FontDefinition> & { __selected?: string; };

const createFileStorage = (filePath: string) => {
    return {
        getItem: async (name: string): Promise<string | null> => {
            try {
                const exists = await fileExists(filePath);
                if (!exists) return null;
                return await readFile(filePath);
            } catch (e) {
                console.error(`Failed to read storage from '${filePath}'`, e);
                return null;
            }
        },
        setItem: async (name: string, value: string): Promise<void> => {
            try {
                await writeFile(filePath, value);
            } catch (e) {
                console.error(`Failed to write storage to '${filePath}'`, e);
            }
        },
        removeItem: async (name: string): Promise<void> => {
            //not real
        },
    };
};

interface FontsStore {
    fonts: FontStorage;
    _hasHydrated: boolean;
    setFont: (name: string, font: FontDefinition) => void;
    removeFont: (name: string) => void;
    setSelected: (name: string | null) => void;
    setHasHydrated: (state: boolean) => void;
}

export const useFonts = create<FontsStore>()(
    persist(
        (set, get) => ({
            fonts: {},
            _hasHydrated: false,
            setFont: (name: string, font: FontDefinition) => {
                set((state) => ({
                    fonts: {
                        ...state.fonts,
                        [name]: font
                    }
                }));
            },
            removeFont: (name: string) => {
                set((state) => {
                    const newFonts = { ...state.fonts };
                    delete newFonts[name];
                    return { fonts: newFonts };
                });
            },
            setSelected: (name: string | null) => {
                set((state) => {
                    const newFonts = { ...state.fonts };
                    if (name) {
                        newFonts.__selected = name;
                    } else {
                        delete newFonts.__selected;
                    }
                    return { fonts: newFonts };
                });
            },
            setHasHydrated: (state: boolean) => {
                set({ _hasHydrated: state });
            }
        }),
        {
            name: 'bunny-fonts',
            storage: createJSONStorage(() => createFileStorage("BUNNY_FONTS")),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            }
        }
    )
);

export const fonts = new Proxy({} as FontStorage, {
    get(target, prop: string) {
        return useFonts.getState().fonts[prop];
    },
    set(target, prop: string, value: FontDefinition | string) {
        if (prop === '__selected') {
            useFonts.getState().setSelected(value as string);
        } else {
            useFonts.getState().setFont(prop, value as FontDefinition);
        }
        return true;
    },
    deleteProperty(target, prop: string) {
        useFonts.getState().removeFont(prop);
        return true;
    },
    has(target, prop: string) {
        return prop in useFonts.getState().fonts;
    },
    ownKeys(target) {
        return Object.keys(useFonts.getState().fonts);
    },
    getOwnPropertyDescriptor(target, prop) {
        const fonts = useFonts.getState().fonts;
        if (prop in fonts) {
            return {
                enumerable: true,
                configurable: true,
            };
        }
    }
});

async function writeFont(font: FontDefinition | null) {
    if (!font && font !== null) throw new Error("Arg font must be a valid object or null");
    
    if (font) {
        await writeFile("fonts.json", JSON.stringify(font));
    } else {
        await removeFile("fonts.json");
    }
}

export function validateFont(font: FontDefinition) {
    if (!font || typeof font !== "object") throw new Error("URL returned a null/non-object JSON");
    // less cool bunny font compatibility (spec:1)
    if (typeof font.spec !== "number") throw new Error("Invalid font 'spec' number");
    if (font.spec >= 2) throw new Error("Only fonts which follows spec:1 or spec:2 are supported");

    const requiredFields = ["name", "main"] as const;
    if (requiredFields.some(f => !font[f])) throw new Error(`Font is missing one of the fields: ${requiredFields.join(", ")}`);
    if (font.name.startsWith("__")) throw new Error("Font names cannot start with __");
    if (font.name in fonts) throw new Error(`There is already a font named '${font.name}' installed`);
}

export async function saveFont(data: string | FontDefinition, selected = false) {
    let fontDefJson: FontDefinition;
    
    if (typeof data === "string") {
        try {
            fontDefJson = await (await safeFetch(data)).json();
        } catch (e) {
            throw new Error(`Failed to fetch fonts at ${data}`, { cause: e });
        }
    } else {
        fontDefJson = data;
    }
    
    validateFont(fontDefJson);
    
    const errors = await Promise.allSettled(
        Object.entries(fontDefJson.main).map(async ([font, url]) => {
            let ext = url.split(".").pop();
            if (ext !== "ttf" && ext !== "otf") ext = "ttf";
            const path = `downloads/fonts/${fontDefJson.name}/${font}.${ext}`;
            if (!await fileExists(path)) await downloadFile(url, path);
        })
    ).then(it => it.map(it => it.status === 'fulfilled' ? undefined : it.reason));
    
    if (errors.some(it => it)) throw errors;
    
    useFonts.getState().setFont(fontDefJson.name, fontDefJson);
    if (selected) writeFont(fontDefJson);
    
    return fontDefJson;
}

export async function updateFont(fontDef: FontDefinition) {
    let fontDefCopy = { ...fontDef };
    
    if (fontDefCopy.source) {
        fontDefCopy = {
            ...await fetch(fontDefCopy.source).then(it => it.json()),
            // Can't change these properties
            name: fontDef.name,
            source: fontDef.source
        };
    }
    
    const selected = useFonts.getState().fonts.__selected === fontDef.name;
    await removeFont(fontDef.name);
    await saveFont(fontDefCopy, selected);
}

export async function installFont(url: string, selected = false) {
    const font = await saveFont(url);
    if (selected) await selectFont(font.name);
}

export async function selectFont(name: string | null) {
    const currentFonts = useFonts.getState().fonts;
    if (name && !(name in currentFonts)) throw new Error("Selected font does not exist!");
    
    useFonts.getState().setSelected(name);
    await writeFont(name == null ? null : currentFonts[name]);
}

export async function removeFont(name: string) {
    const selected = useFonts.getState().fonts.__selected === name;
    if (selected) await selectFont(null);
    
    useFonts.getState().removeFont(name);
    
    try {
        await clearFolder(`downloads/fonts/${name}`);
    } catch {
        // ignore
    }
}

async function waitForHydration(): Promise<void> {
    return new Promise((resolve) => {
        if (useFonts.getState()._hasHydrated) {
            resolve();
            return;
        }
        
        const unsubscribe = useFonts.subscribe(
            (state) => {
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

export async function initFonts() {
    await waitForHydration();
    
    const currentFonts = useFonts.getState().fonts;
    
    Promise.allSettled(
        Object.keys(currentFonts).map(
            name => saveFont(currentFonts[name], currentFonts.__selected === name)
        )
    );
}
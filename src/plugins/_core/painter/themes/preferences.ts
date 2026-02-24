import { createFileStorage } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

interface RainColorPreferencesStorage {
    selected: string | null;
    type?: "dark" | "light" | null;
    customBackground: "hidden" | null;
    per?: Record<string, { autoUpdate?: string; } | undefined>;
}

interface ColorsPrefStore extends RainColorPreferencesStorage {
    setType: (type: "dark" | "light" | null | undefined) => void;
    setCustomBackground: (background: "hidden" | null) => void;
    setSelected: (selected: string | null) => void;
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
}

export const useColorsPref = create<ColorsPrefStore>()(
    persist(
        set => ({
            selected: null,
            customBackground: null,
            _hasHydrated: false,
            setType: type => set({ type }),
            setCustomBackground: background => set({ customBackground: background }),
            setSelected: selected => set({ selected }),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "colors-pref",
            storage: createJSONStorage(() => createFileStorage("themes/colors/preferences.json")),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            }
        }
    )
);

export const colorsPref = new Proxy({} as RainColorPreferencesStorage, {
    get(target, prop: string) {
        return useColorsPref.getState()[prop as keyof RainColorPreferencesStorage];
    },
    set(target, prop: string, value: any) {
        const state = useColorsPref.getState();
        if (prop === "type") state.setType(value);
        else if (prop === "customBackground") state.setCustomBackground(value);
        else if (prop === "selected") state.setSelected(value);
        return true;
    }
});

export async function waitForColorsPrefHydration(): Promise<void> {
    return new Promise(resolve => {
        if (useColorsPref.getState()._hasHydrated) {
            resolve();
            return;
        }

        const unsubscribe = useColorsPref.subscribe(
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

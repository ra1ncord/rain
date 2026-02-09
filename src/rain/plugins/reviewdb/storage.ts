import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface Settings {
    authToken: string;
    useThemedSend: boolean;
}

type ReviewDBSettingsStore = PluginStore<Settings>;

export const useReviewDBSettings = create<ReviewDBSettingsStore>()(
    persist(
        (set) => ({
            authToken: "",
            useThemedSend: true,
            _hasHydrated: false,
            updateSettings: (newSettings) =>
                set((state) => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "reviewdb-settings",
            storage: createJSONStorage(() =>
                createFileStorage("plugins/reviewdb.json"),
            ),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        },
    ),
);

export const reviewdbSettings = new Proxy({} as Settings, {
    get(target, prop: string) {
        return useReviewDBSettings.getState()[prop as keyof Settings];
    },
    set(target, prop: string, value: any) {
        useReviewDBSettings
            .getState()
            .updateSettings({ [prop]: value } as Partial<Settings>);
        return true;
    },
});

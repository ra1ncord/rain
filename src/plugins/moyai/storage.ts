import { createFileStorage } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface MoyaiSettings {
    allowReactions: boolean;
}

type MoyaiSettingsStore = MoyaiSettings & {
    updateSettings: (settings: Partial<MoyaiSettings>) => void;
};

export const useMoyaiSettings = create<MoyaiSettingsStore>()(
    persist(
        set => ({
            allowReactions: true,
            updateSettings: newSettings => set(state => ({ ...state, ...newSettings })),
        }),
        {
            name: "moyai-settings",
            storage: createJSONStorage(() => createFileStorage("plugins/moyai.json")),
        }
    )
);

export const moyaiSettings = new Proxy({} as MoyaiSettings, {
    get(target, prop: string) {
        return useMoyaiSettings.getState()[prop as keyof MoyaiSettings];
    },
    set(target, prop: string, value: any) {
        useMoyaiSettings.getState().updateSettings({ [prop]: value });
        return true;
    }
});

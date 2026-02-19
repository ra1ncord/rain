import { createFileStorage } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface LetItRainSettings {
    amount: number;
    size: number;
    transparency: number;
    speed: number;
    color: string;
}

interface LetItRainStore {
    settings: LetItRainSettings;
    updateSetting: <K extends keyof LetItRainSettings>(key: K, value: LetItRainSettings[K]) => void;
}

const DEFAULT_SETTINGS: LetItRainSettings = {
    amount: 50,
    size: 1,
    transparency: 0.8,
    speed: 1,
    color: "#4A9EFF"
};

export const useLetItRainSettings = create<LetItRainStore>()(
    persist(
        (set) => ({
            settings: DEFAULT_SETTINGS,
            updateSetting: (key, value) => set((state) => ({
                settings: { ...state.settings, [key]: value }
            }))
        }),
        {
            name: "letitrain-settings",
            storage: createJSONStorage(() => createFileStorage("plugins/letitrain.json"))
        }
    )
);

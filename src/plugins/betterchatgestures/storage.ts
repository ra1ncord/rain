import { createFileStorage } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface BetterChatGesturesSettings {
    tapUsernameMention: boolean;
    reply: boolean;
    userEdit: boolean;
    delay: string;
    debugMode: boolean;
    hydrated: boolean;
}

interface BetterChatGesturesStore extends BetterChatGesturesSettings {
    updateSettings: (settings: Partial<Omit<BetterChatGesturesSettings, "hydrated">>) => void;
    setHydrated: () => void;
}

export const useBetterChatGesturesSettings = create<BetterChatGesturesStore>()(
    persist(
        set => ({
            tapUsernameMention: true,
            reply: true,
            userEdit: true,
            delay: "1000",
            debugMode: false,
            hydrated: false,
            updateSettings: settings => set(settings),
            setHydrated: () => set({ hydrated: true }),
        }),
        {
            name: "betterchatgestures-settings",
            storage: createJSONStorage(() => createFileStorage("betterchatgestures-settings.json")),
            onRehydrateStorage: () => state => {
                state?.setHydrated();
            },
        }
    )
);

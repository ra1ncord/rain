import { createFileStorage, PluginStore } from "@api/storage";
import { UserStore } from "@metro/common/stores";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { UserData } from "../types";

interface CacheState {
    data: UserData | undefined;
    at: string | undefined;
    dir: Record<string, { data: UserData; at: string }>;
    init: () => void;
    updateData: (data?: UserData, at?: string) => void;
    hasData: () => boolean;
    _hasHydrated: boolean;
}

type CacheStore = PluginStore<CacheState>;

export const useCacheStore = create<CacheStore>()(
    persist(
        (set, get) => ({
            data: undefined,
            at: undefined,
            dir: {},
            _hasHydrated: false,
            init() {
                const userId = UserStore.getCurrentUser()?.id;
                if (userId) {
                    const { data, at } = get().dir[userId] ?? {};
                    set({ data, at });
                }
            },
            updateData(data, at) {
                const userId = UserStore.getCurrentUser()?.id;
                if (userId) {
                    set({
                        data,
                        at,
                        dir: {
                            ...get().dir,
                            [userId]: { data: data!, at: at! },
                        },
                    });
                }
            },
            hasData: () => !!get().data && !!get().at,
            updateSettings: (newSettings: Partial<CacheState>) =>
                set(state => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "cloud-sync-cache",
            storage: createJSONStorage(() =>
                createFileStorage("plugins/cloud-sync-cache.json"),
            ),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
                state?.init();
            },
        },
    ),
);

import { createFileStorage, PluginStore } from "@api/storage";
import { UserStore } from "@metro/common/stores";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthorizationState {
    token: string | undefined;
    tokens: Record<string, string | undefined>;
    init: () => void;
    setToken: (token?: string) => void;
    isAuthorized: () => boolean;
    _hasHydrated: boolean;
}

type AuthorizationStore = PluginStore<AuthorizationState>;

export const useAuthorizationStore = create<AuthorizationStore>()(
    persist(
        (set, get) => ({
            token: undefined,
            tokens: {},
            _hasHydrated: false,
            init() {
                const userId = UserStore.getCurrentUser()?.id;
                if (userId) {
                    set({
                        token: get().tokens[userId],
                    });
                }
            },
            setToken(token) {
                const userId = UserStore.getCurrentUser()?.id;
                if (userId) {
                    set({
                        token,
                        tokens: {
                            ...get().tokens,
                            [userId]: token,
                        },
                    });
                }
            },
            isAuthorized: () => !!get().token,
            updateSettings: (newSettings: Partial<AuthorizationState>) =>
                set(state => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "cloud-sync-auth",
            storage: createJSONStorage(() =>
                createFileStorage("plugins/cloud-sync-auth.json"),
            ),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
                state?.init();
            },
        },
    ),
);

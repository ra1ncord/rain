import { createFileStorage, PluginStore } from "@api/storage";
import { findByStoreName } from "@metro";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import subscribeToFluxDispatcher from "../utils/subscribeToFluxDispatcher";

const UserStore = findByStoreName("UserStore");

interface AuthorizationState {
  token: string | null;
  tokens: Record<string, string>;
}

type AuthorizationStore = PluginStore<AuthorizationState> & {
  init: () => void;
  setToken: (token: string) => void;
  isAuthorized: () => boolean;
};

export const useAuthorizationStore = create<AuthorizationStore>()(
    persist(
        (set, get) => ({
            token: null,
            tokens: {},
            _hasHydrated: false,

            init: () => {
                const user = UserStore?.getCurrentUser?.();
                if (!user?.id) return;

                const { tokens } = get();
                set({ token: tokens[user.id] ?? null });
            },

            setToken: (token: string) => {
                const user = UserStore?.getCurrentUser?.();
                if (!user?.id) return;

                set(state => ({
                    token: token,
                    tokens: { ...state.tokens, [user.id]: token },
                }));
            },

            isAuthorized: () => {
                return !!get().token;
            },

            updateSettings: newSettings =>
                set(state => ({ ...state, ...newSettings })),

            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "decor-auth",
            storage: createJSONStorage(() =>
                createFileStorage("plugins/decor_auth.json")
            ),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
                state?.init();
            },
        }
    )
);

export const unsubscribe = subscribeToFluxDispatcher("CONNECTION_OPEN", () =>
    useAuthorizationStore.getState().init()
);

export const decorAuthSettings = new Proxy({} as AuthorizationState, {
    get(_, prop: string) {
        return useAuthorizationStore.getState()[prop as keyof AuthorizationState];
    },
    set(_, prop: string, value: any) {
        useAuthorizationStore.getState().updateSettings({ [prop]: value });
        return true;
    },
});

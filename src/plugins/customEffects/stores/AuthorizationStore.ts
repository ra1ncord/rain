import { createFileStorage } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage,persist } from "zustand/middleware";

interface AuthState {
    token?: string;
    setToken: (token?: string) => void;
    isAuthorized: () => boolean;
}

export const useAuthorizationStore = create(
    persist<AuthState>(
        (set, get) => ({
            token: undefined,
            setToken: token => set({ token }),
            isAuthorized: () => !!get().token,
        }),
        {
            name: "customeffects-auth",
            storage: createJSONStorage(() =>
                createFileStorage("plugins/customeffects-auth.json")
            ),
        }
    )
);

import { findByStoreName } from "@metro";
import { FluxDispatcher } from "@metro/common";
import { debounce } from "lodash";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import { Decoration, deleteDecoration, getUserDecoration, getUserDecorations, NewDecoration, setUserDecoration } from "../api";
import decorationToString from "../utils/decorationToString";
import discordifyDecoration from "../utils/discordifyDecoration";
import subscribeToFluxDispatcher from "../utils/subscribeToFluxDispatcher";
import { useUsersDecorationsStore } from "./UsersDecorationsStore";

const UserStore = findByStoreName("UserStore");

interface CurrentUserDecorationsState {
    decorations: Decoration[];
    selectedDecoration: Decoration | null;
    fetched: boolean;
    fetch: () => Promise<void>;
    delete: (decoration: Decoration | string) => Promise<void>;
    create: (decoration: NewDecoration) => Promise<void>;
    select: (decoration: Decoration | null) => Promise<void>;
    clear: () => void;
}

function updateCurrentUserAvatarDecoration(decoration: Decoration | null) {
    const user = UserStore.getCurrentUser();
    if (decoration) {
        user.avatarDecoration = discordifyDecoration(decoration);
        user.avatarDecorationData = user.avatarDecoration;
    }

    useUsersDecorationsStore.getState().set(user.id, decoration ? decorationToString(decoration) : null);
    FluxDispatcher.dispatch({ type: "CURRENT_USER_UPDATE", user });
    FluxDispatcher.dispatch({ type: "USER_SETTINGS_ACCOUNT_SUBMIT_SUCCESS" });
}

export const useCurrentUserDecorationsStore = create(
    subscribeWithSelector<CurrentUserDecorationsState>((set, get) => ({
        decorations: [],
        selectedDecoration: null,
        fetched: false,
        fetch: async () => {
            const decorations = await getUserDecorations();
            const selected = await getUserDecoration();
            set({ decorations, selectedDecoration: selected, fetched: true });
        },
        create: async (newDecoration: NewDecoration) => {
            const decoration = (await setUserDecoration(newDecoration)) as Decoration;
            set({ decorations: [...get().decorations, decoration] });
        },
        delete: async (decoration: Decoration | string) => {
            const hash = typeof decoration === "object" ? decoration.hash : decoration;
            await deleteDecoration(hash);

            const { selectedDecoration, decorations } = get();
            const newState: any = { decorations: decorations.filter(d => d.hash !== hash) };
            if (selectedDecoration?.hash === hash) newState.selectedDecoration = null;

            set(newState);
        },
        select: async (decoration: Decoration | null) => {

            set({ selectedDecoration: decoration });
        },
        clear: () => set({ decorations: [], selectedDecoration: null, fetched: false })
    }))
);

export const subscriptions = [
    useCurrentUserDecorationsStore.subscribe(
        state => [state.selectedDecoration, state.fetched],
        debounce(([decoration, fetched], [prevDecoration, prevFetched]) => {
            if (fetched !== prevFetched || decoration?.hash === prevDecoration?.hash) return;

            const bllub = setUserDecoration(decoration);



            updateCurrentUserAvatarDecoration(decoration);
        }, 1000)
    ),
    subscribeToFluxDispatcher("CONNECTION_OPEN", () => useCurrentUserDecorationsStore.getState().clear())
];

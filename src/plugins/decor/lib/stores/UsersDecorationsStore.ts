/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findByStoreName } from "@metro";
import { FluxDispatcher } from "@metro/common";
import { debounce } from "lodash";
import { create } from "zustand";

import { getUsersDecorations } from "../api";
import { SKU_ID } from "../constants";
import subscribeToFluxDispatcher from "../utils/subscribeToFluxDispatcher";

const UserStore = findByStoreName("UserStore");
const SelectedChannelStore = findByStoreName("SelectedChannelStore");


interface UsersDecorationsState {
	usersDecorations: Map<string, string | null>;
	fetchQueue: Set<string>;
	bulkFetch: () => Promise<void>;
	fetch: (userId: string, force?: boolean) => Promise<void>;
	fetchMany: (userIds: string[]) => Promise<void>;
	get: (userId: string) => string | null | undefined;
	has: (userId: string) => boolean;
	set: (userId: string, decoration: string | null) => void;
}

export const useUsersDecorationsStore = create<UsersDecorationsState>((set, get) => ({
    usersDecorations: new Map(),
    fetchQueue: new Set(),
    bulkFetch: debounce(async () => {
        const { fetchQueue, usersDecorations } = get();

        set({ fetchQueue: new Set() });

        const fetchIds = Array.from(fetchQueue);
        if (fetchIds.length === 0) return;
        const fetchedUsersDecorations = await getUsersDecorations(fetchIds);

        const newUsersDecorations = new Map(usersDecorations);

        for (const [userId, decoration] of Object.entries(fetchedUsersDecorations)) {
            newUsersDecorations.set(userId, decoration);

            const user = UserStore.getUser(userId) as any;
            if (user) {
                user.avatarDecoration = decoration ? { asset: decoration, skuId: SKU_ID } : null;
                user.avatarDecorationData = user.avatarDecoration;

                FluxDispatcher.dispatch({ type: "USER_UPDATE", user });
            }
        }

        for (const fetchedId of fetchIds) {
            if (!newUsersDecorations.has(fetchedId)) newUsersDecorations.set(fetchedId, null);
        }

        set({ usersDecorations: newUsersDecorations });
    }) as () => Promise<void>,
    async fetch(userId: string, force: boolean = false) {
        const { usersDecorations, fetchQueue, bulkFetch } = get();

        if (!force && usersDecorations.has(userId)) return;

        set({ fetchQueue: new Set(fetchQueue).add(userId) });
        bulkFetch();
    },
    async fetchMany(userIds) {
        if (!userIds.length) return;
        const { usersDecorations, fetchQueue, bulkFetch } = get();

        const newFetchQueue = new Set(fetchQueue);
        for (const userId of userIds) {
            if (!usersDecorations.has(userId)) newFetchQueue.add(userId);
        }

        set({ fetchQueue: newFetchQueue });
        bulkFetch();
    },
    get(userId: string) {
        return get().usersDecorations.get(userId);
    },
    has(userId: string) {
        return get().usersDecorations.has(userId);
    },
    set(userId: string, decoration: string | null) {
        const { usersDecorations } = get();
        const newUsersDecorations = new Map(usersDecorations);

        newUsersDecorations.set(userId, decoration);
        set({ usersDecorations: newUsersDecorations });
    }
}));

export const subscriptions = [
    subscribeToFluxDispatcher("LOAD_MESSAGES_SUCCESS", ({ messages }) => {
        useUsersDecorationsStore.getState().fetchMany(messages.map(m => m.author.id));
    }),
    subscribeToFluxDispatcher("CONNECTION_OPEN", () => {
        useUsersDecorationsStore.getState().fetch(UserStore.getCurrentUser().id, true);
    }),
    subscribeToFluxDispatcher("MESSAGE_CREATE", data => {
        const channelId = SelectedChannelStore.getChannelId();
        if (data.channelId === channelId) {
            useUsersDecorationsStore.getState().fetch(data.message.author.id);
        }
    }),
    subscribeToFluxDispatcher("TYPING_START", data => {
        const channelId = SelectedChannelStore.getChannelId();
        if (data.channelId === channelId) {
            useUsersDecorationsStore.getState().fetch(data.userId);
        }
    })
];

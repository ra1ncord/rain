import { after, before, instead } from "@api/patcher";
import { logger } from "@lib/utils/logger";
import { findByFilePath, findByTypeDisplayName } from "@metro";
import { definePlugin } from "@plugins";
import { Contributors } from "@rain/Developers";
import React from "react";

import DeclutterSettings from "./settings";
import { useDeclutterSettings } from "./storage";
import { installClutterSurfaces, installProfileAndPaymentSurfaces } from "./surfaces";

const CosmeticPreviewContext = React.createContext(false);

function CosmeticPreview({ render, props }: { render: (props: any) => React.ReactNode; props: any }) {
    return render(props);
}

const previewScope = {
    useIsPreview: () => React.useContext(CosmeticPreviewContext),
    wrap: (render: (props: any) => React.ReactNode, props: any) => React.createElement(
        CosmeticPreviewContext.Provider,
        { value: true },
        React.createElement(CosmeticPreview, { render, props }),
    ),
};

type Unpatch = () => unknown;
const unpatches: Unpatch[] = [];
const pending = new Set<ReturnType<typeof setImmediate>>();
let active = false;
let wrappedActions = new WeakSet<object>();

function defer(callback: () => void) {
    const id = setImmediate(() => {
        pending.delete(id);
        if (active) callback();
    });
    pending.add(id);
}

function stop() {
    active = false;
    for (const id of pending) clearImmediate(id);
    pending.clear();
    for (const unpatch of unpatches.splice(0).reverse()) {
        try {
            unpatch();
        } catch (error) {
            logger.error("[Declutter] Failed to remove patch", error);
        }
    }
    wrappedActions = new WeakSet();
}

export default definePlugin({
    name: "Declutter",
    description: "Hide chat clutter, profile cosmetics and payment settings",
    author: [Contributors.palmdevs],
    id: "declutter",
    version: "2.1.2",
    requiresRestart: true,
    start() {
        stop();
        active = true;
        try {
            const actions = findByTypeDisplayName("ChatInputActions")?.type;
            const send = findByTypeDisplayName("ChatInputSendButton")?.type;
            const right = findByTypeDisplayName("ChatInputRightActions")?.type;
            for (const [name, target] of [["ChatInputActions", actions], ["ChatInputSendButton", send], ["ChatInputRightActions", right]] as const) {
                if (typeof target?.render !== "function") throw new Error(`Declutter: ${name}.render is unavailable`);
            }
            const settings = () => useDeclutterSettings.getState();
            unpatches.push(...installClutterSurfaces(
                findByFilePath("modules/guild_sidebar/useGuildActionRows.tsx"),
                findByFilePath("modules/main_tabs_v2/native/tabs/messages/items/MessagesItemHappeningNow.tsx"),
                settings,
                instead,
            ));
            unpatches.push(...installProfileAndPaymentSurfaces(findByFilePath, settings, instead, previewScope));
            unpatches.push(after("render", send, (_args, tree) => {
                const item = tree?.props?.children?.props?.items?.[0];
                if (item && settings().hide.voice) item.sendVoiceMessageEnabled = false;
                return tree;
            }));
            unpatches.push(before("render", right, args => {
                if (args[0] && settings().hide.gift) args[0] = { ...args[0], shouldShowGiftButton: false };
            }));
            unpatches.push(before("render", actions, args => {
                if (!args[0]) return;
                const state = settings();
                args[0] = {
                    ...args[0],
                    isAppLauncherEnabled: args[0].isAppLauncherEnabled && !state.hide.app,
                    canStartThreads: state.show.thread || (!state.hide.thread && args[0].canStartThreads),
                    shouldShowGiftButton: args[0].shouldShowGiftButton && !state.hide.gift,
                };
            }));
            unpatches.push(after("render", actions, args => {
                const ref = args[1];
                defer(() => defer(() => {
                    const target = ref?.current;
                    if (!target || typeof target.onDismissActions !== "function" || wrappedActions.has(target)) return;
                    wrappedActions.add(target);
                    unpatches.push(instead("onDismissActions", target, (args, original) => {
                        if (settings().dismiss.actions) return original(...args);
                    }));
                }));
            }));
        } catch (error) {
            stop();
            throw error;
        }
    },
    stop,
    settings: DeclutterSettings,
});

import { after, before } from "@api/patcher";
import { logger } from "@lib/utils/logger";
import { findByTypeDisplayName } from "@metro";
import { definePlugin } from "@plugins";
import { Contributors } from "@rain/Developers";
import React from "react";

import BetterChatButtonsSettings from "./settings";
import { useBetterChatButtonsSettings } from "./storage";

const ChatInputActions = findByTypeDisplayName("ChatInputActions");
let actionsRef: React.RefObject<{ onShowActions(): void; onDismissActions(): void }>;

type Unpatch = () => void;

const unpatches: Unpatch[] = [];

export default definePlugin({
    name: "BetterChatButtons",
    description: "Customize all the annoying chat buttons",
    author: [Contributors.palmdevs],
    id: "betterchatbuttons",
    version: "1.0.0",
    async eagerStart() {
        if (ChatInputActions?.type) {
            unpatches.push(
                before("render", ChatInputActions.type, ([props, ref]) => {
                    const state = useBetterChatButtonsSettings.getState();
                    if (props.isAppLauncherEnabled) props.isAppLauncherEnabled = !state.hide.app;
                    props.canStartThreads = state.show.thread || !state.hide.thread;
                    props.shouldShowGiftButton = !state.hide.gift;
                    actionsRef = ref;
                })
            );

            unpatches.push(
                after("render", ChatInputActions.type, () => {
                    setImmediate(() =>
                        setImmediate(() => {
                            if (actionsRef?.current) {
                                const { onDismissActions } = actionsRef.current;
                                unpatches.push(() => (actionsRef.current.onDismissActions = onDismissActions));
                                actionsRef.current.onDismissActions = () => {
                                    const state = useBetterChatButtonsSettings.getState();
                                    if (state.dismiss.actions) return onDismissActions();
                                };
                            }
                        })
                    );
                })
            );
        }
    },
    async start() {
        if (ChatInputActions?.type) {
            unpatches.push(
                before("render", ChatInputActions.type, ([props, ref]) => {
                    const state = useBetterChatButtonsSettings.getState();
                    if (props.isAppLauncherEnabled) props.isAppLauncherEnabled = !state.hide.app;
                    props.canStartThreads = state.show.thread || !state.hide.thread;
                    props.shouldShowGiftButton = !state.hide.gift;
                    actionsRef = ref;
                })
            );

            unpatches.push(
                after("render", ChatInputActions.type, () => {
                    setImmediate(() =>
                        setImmediate(() => {
                            if (actionsRef?.current) {
                                const { onDismissActions } = actionsRef.current;
                                unpatches.push(() => (actionsRef.current.onDismissActions = onDismissActions));
                                actionsRef.current.onDismissActions = () => {
                                    const state = useBetterChatButtonsSettings.getState();
                                    if (state.dismiss.actions) return onDismissActions();
                                };
                            }
                        })
                    );
                })
            );
        }
    },
    stop() {
        // todo: actually fix this instead of a try catch
        try{
            for (const unpatch of unpatches) unpatch();
        } catch(error) {
            logger.log(error);
        }
        unpatches.length = 0;
    },
    settings: BetterChatButtonsSettings,
});

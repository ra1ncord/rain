import { after, before } from "@api/patcher";
import { componentTarget } from "@api/react/componentTarget";
import { logger } from "@lib/utils/logger";
import { findByTypeDisplayName } from "@metro";
import { definePlugin } from "@plugins";
import { Contributors } from "@rain/Developers";
import React from "react";

import BetterChatButtonsSettings from "./settings";
import { useBetterChatButtonsSettings } from "./storage";

const ChatInputActions = findByTypeDisplayName("ChatInputActions", false);
const ChatInputSendButton = findByTypeDisplayName("ChatInputSendButton", false);
const ChatInputRightActions = findByTypeDisplayName("ChatInputRightActions", false);

let actionsRef: React.RefObject<{ onShowActions(): void; onDismissActions(): void }>;

type Unpatch = () => void;

const unpatches: Unpatch[] = [];

export default definePlugin({
    name: "BetterChatButtons",
    description: "Customize all the annoying chat buttons",
    author: [Contributors.palmdevs],
    id: "betterchatbuttons",
    version: "1.1.0",
    async start() {
        const state = useBetterChatButtonsSettings.getState();

        const sendButton = componentTarget(ChatInputSendButton);
        const rightActions = componentTarget(ChatInputRightActions);
        const actions = componentTarget(ChatInputActions);

        if (sendButton) {
            unpatches.push(
                after(sendButton.key, sendButton.parent, (args, tree) => {
                    const item = tree?.props?.children?.props?.items?.[0];
                    if (item && state.hide?.voice) {
                        item.sendVoiceMessageEnabled = false;
                    }
                    return tree;
                })
            );
        }

        if (rightActions) {
            unpatches.push(
                before(rightActions.key, rightActions.parent, ([props]) => {
                    if (props) props.shouldShowGiftButton = !state.hide?.gift;
                })
            );
        }

        if (actions) {
            unpatches.push(
                before(actions.key, actions.parent, ([props, ref]) => {
                    if (props.isAppLauncherEnabled) props.isAppLauncherEnabled = !state.hide.app;
                    props.canStartThreads = state.show?.thread || !state.hide.thread;
                    props.shouldShowGiftButton = !state.hide.gift;
                    actionsRef = ref;
                })
            );

            unpatches.push(
                after(actions.key, actions.parent, () => {
                    setImmediate(() =>
                        setImmediate(() => {
                            if (actionsRef?.current) {
                                const { onDismissActions } = actionsRef.current;
                                unpatches.push(() => (actionsRef.current.onDismissActions = onDismissActions));
                                actionsRef.current.onDismissActions = () => {
                                    if (state.dismiss?.actions) return onDismissActions();
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

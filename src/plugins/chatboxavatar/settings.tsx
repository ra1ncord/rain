import { Stack, TableRadioGroup, TableRadioRow } from "@metro/common/components";
import React from "react";

import { ChatboxAvatarSettings, useChatboxAvatarSettings } from "./storage";
export default function ChatboxAvatarSettings() {
    const settings = useChatboxAvatarSettings();
    const [, forceUpdate] = React.useReducer(x => ~x, 0);
    const setPressAction = (value: string) => {
        useChatboxAvatarSettings.getState().updateSettings?.({ pressAction: value as ChatboxAvatarSettings["pressAction"] });
        forceUpdate();
    };
    const setLongPressAction = (value: string) => {
        useChatboxAvatarSettings.getState().updateSettings?.({ longPressAction: value as ChatboxAvatarSettings["longPressAction"] });
        forceUpdate();
    };
    return (
        <Stack style={{ padding: 16 }} spacing={16}>
            <TableRadioGroup
                value={settings.pressAction}
                onChange={setPressAction}
                title="Avatar Press Action"
            >
                <TableRadioRow value="profile" label="Open Profile" />
                <TableRadioRow value="server" label="Open Status Picker" />
            </TableRadioGroup>
            <TableRadioGroup
                value={settings.longPressAction}
                onChange={setLongPressAction}
                title="Avatar Long-Press Action"
            >
                <TableRadioRow value="profile" label="Open Profile" />
                <TableRadioRow value="server" label="Open Status Picker" />
            </TableRadioGroup>
            <TableRadioGroup
                value={settings.showStatusCutout ? "true" : "false"}
                onChange={v => {
                    useChatboxAvatarSettings.getState().updateSettings?.({ showStatusCutout: v === "true" });
                    forceUpdate();
                }}
                title="Status Icon"
            >
                <TableRadioRow value="true" label="Show" />
                <TableRadioRow value="false" label="Hide" />
            </TableRadioGroup>
            <TableRadioGroup
                value={settings.collapseWhileTyping ? "true" : "false"}
                onChange={v => {
                    useChatboxAvatarSettings.getState().updateSettings?.({ collapseWhileTyping: v === "true" });
                    forceUpdate();
                }}
                title="Collapse While Typing"
            >
                <TableRadioRow value="true" label="Collapse avatar while typing" />
                <TableRadioRow value="false" label="Always show avatar" />
            </TableRadioGroup>
        </Stack>
    );
}

import { deleteJsxCreate, onJsxCreate } from "@api/react/jsx";
import { waitForHydration } from "@api/storage";
import { React } from "@metro/common";

import { safe } from "../crash";
import { useToolbar } from "../toolbar";
import DeafenButton from "./DeafenButton";
import { deafenButtonSettings, useDeafenButtonSettings } from "./storage";

const ANCHOR = "VideoButton";
let release: (() => void) | null = null;

const inject = safe("deafen button", (_Component: any, ret: any) => {
    if (!ret) return ret;
    const btn = <DeafenButton key="cheeseburger-deafen" />;
    return deafenButtonSettings.placeAfter
        ? <React.Fragment>{ret}{btn}</React.Fragment>
        : <React.Fragment>{btn}{ret}</React.Fragment>;
});

export default {
    async start() {
        await waitForHydration(useDeafenButtonSettings);
        const s = useDeafenButtonSettings.getState();
        if (!s.sized) s.updateSettings({ sized: true, ...(s.iconSize === 26 ? { iconSize: 24 } : {}) });
        release ??= useToolbar();
        onJsxCreate(ANCHOR, inject);
    },
    stop() {
        deleteJsxCreate(ANCHOR, inject);
        release?.();
        release = null;
    },
};

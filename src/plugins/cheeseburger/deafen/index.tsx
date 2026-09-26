import { deleteJsxCreate, onJsxCreate } from "@api/react/jsx";
import { waitForHydration } from "@api/storage";
import { React } from "@metro/common";

import DeafenButton from "./DeafenButton";
import { deafenButtonSettings, useDeafenButtonSettings } from "./storage";

const ANCHOR = "VideoButton";

function inject(_Component: any, ret: any) {
    if (!ret) return ret;
    const btn = <DeafenButton key="cheeseburger-deafen" />;
    return deafenButtonSettings.placeAfter
        ? <React.Fragment>{ret}{btn}</React.Fragment>
        : <React.Fragment>{btn}{ret}</React.Fragment>;
}

export default {
    async start() {
        await waitForHydration(useDeafenButtonSettings);
        onJsxCreate(ANCHOR, inject);
    },
    stop() {
        deleteJsxCreate(ANCHOR, inject);
    },
};

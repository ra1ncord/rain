import { instead } from "@api/patcher";
import { logger } from "@lib/utils/logger";
import { findByFilePath } from "@metro";
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
function stop() {
    for (const unpatch of unpatches.splice(0).reverse()) {
        try {
            unpatch();
        } catch (error) {
            logger.error("[Declutter] Failed to remove patch", error);
        }
    }
}

export default definePlugin({
    name: "Declutter",
    description: "Hide server boost goals, DM activity cards, profile cosmetics and payment settings",
    author: [Contributors.palmdevs],
    id: "declutter",
    version: "2.2.0",
    requiresRestart: true,
    start() {
        stop();
        try {
            const settings = () => useDeclutterSettings.getState();
            unpatches.push(...installClutterSurfaces(
                findByFilePath("modules/guild_sidebar/useGuildActionRows.tsx"),
                findByFilePath("modules/main_tabs_v2/native/tabs/messages/items/MessagesItemHappeningNow.tsx"),
                settings,
                instead,
            ));
            unpatches.push(...installProfileAndPaymentSurfaces(findByFilePath, settings, instead, previewScope));
        } catch (error) {
            stop();
            throw error;
        }
    },
    stop,
    settings: DeclutterSettings,
});

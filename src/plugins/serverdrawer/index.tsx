import { after } from "@api/patcher";
import { deleteJsxCreate, onJsxCreate } from "@api/react/jsx";
import { showToast } from "@api/ui/toasts";
import { logger } from "@lib/utils/logger";
import { findByName, findByProps, findByTypeName } from "@metro";
import { definePlugin } from "@plugins";
import { computeGuildDockSpecs, createController, createServerDrawerSurface, DOCK_REST_OFFSET } from "@plugins/serverdrawer/surface";
import { Contributors, Developers } from "@rain/Developers";
import React from "react";
import * as Native from "react-native";

import type * as t from "./types";

let dispose: (() => void) | undefined;

export default definePlugin({
    name: "ServerDrawer",
    id: "serverdrawer",
    description: "A compact server dock with a searchable server and DM drawer, folders, and drag and drop",
    author: [Developers.kmmiio99o, Contributors.Rosie, Contributors.benjii],
    version: "1.0.0",
    requiresRestart: true,

    // Register before the first panel render; initialize native dependencies when that panel is first created.
    eagerStart() {
        dispose?.();

        const abort = new AbortController();
        let DrawerSurface: React.ComponentType<t.ServerDrawerSurfaceProps>;
        let useInset: () => number;
        const unpatch: (() => void)[] = [];
        let initializationError: string | undefined;

        const useActive = () => React.useSyncExternalStore(listener => {
            abort.signal.addEventListener("abort", listener);

            return () => abort.signal.removeEventListener("abort", listener);
        }, () => !abort.signal.aborted);

        function YouBarBackdrop({ element }: t.ElementProps) {
            const height = useInset();
            const active = useActive();

            return active ? <Native.View pointerEvents="none" style={{ position: "absolute", bottom: 0, left: 0, right: 0,
                height, overflow: "hidden" }}>{element}</Native.View> : element;
        }

        function ServerDrawerLeftPanel({ element }: t.ElementProps) {
            const rendered = (element.type as t.PanelComponent)(element.props);
            const active = useActive();
            const bottomInset = useInset();
            const [width, setWidth] = React.useState(() => Native.Dimensions.get("window").width);

            return active ? transformLeftPanelContent(rendered,
                <DrawerSurface key="rain-server-drawer" bottomInset={bottomInset} onWidthChange={setWidth} />,
                computeGuildDockSpecs(width - 16).dockHeight - DOCK_REST_OFFSET) : rendered;
        }

        const wrapPanel = (_Original: t.PanelComponent, element: t.PanelElement) => {
            try {
                if (!DrawerSurface) {
                    const inset = findByProps("useYouBarTotalHeight");
                    if (typeof inset?.useYouBarTotalHeight !== "function") throw new Error("ServerDrawer: native YouBar inset is unavailable");

                    const shade = findByTypeName("YouBarFloatingShade");
                    if (typeof shade?.type !== "function") throw new Error("ServerDrawer: native YouBar shade is unavailable");
                    const channelWidth = findByName("useChannelListWidth", false);
                    if (typeof channelWidth?.default !== "function") throw new Error("ServerDrawer: native channel width is unavailable");
                    const { DM_WIDTH } = findByProps("DM_WIDTH");
                    const surface = createServerDrawerSurface(createController(), abort.signal);
                    useInset = () => {
                        const height = inset.useYouBarTotalHeight();

                        return Math.max(0, Number.isFinite(height) ? height : 0);
                    };
                    unpatch.push(after("type", shade, (_args, element) => <YouBarBackdrop element={element} />));

                    // The channel panel now occupies the space reserved for the native server rail.
                    unpatch.push(after("default", channelWidth, (_args, width: number) => width + DM_WIDTH));
                    DrawerSurface = surface;
                }
            } catch (error) {
                const message = String(error);
                if (message !== initializationError) logger.error("[ServerDrawer] " + message);
                initializationError = message;

                return element;
            }

            return <ServerDrawerLeftPanel key={element.key} element={element} />;
        };

        onJsxCreate("LeftPanelContent", wrapPanel);
        dispose = () => {
            deleteJsxCreate("LeftPanelContent", wrapPanel);
            unpatch.forEach(dispose => dispose());
            abort.abort();
            dispose = undefined;
        };
    },

    stop() { dispose?.(); }
});

export function reportActionFailure(operation: string, error: unknown): void {
    logger.error(`[ServerDrawer] ${operation} failed`, error);
    showToast(`Could not ${operation}. Please try again.`);
}

// Reserve only the dock: native channel screens already account for the You bar.
export function transformLeftPanelContent(rendered: t.NativePanel, dock: React.ReactNode, dockHeight: number) {
    const [rail, content] = rendered.props.children;

    return React.cloneElement(rendered, { children: [<Native.View key="rail" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none"
        style={{ height: 1, width: 1, position: "absolute", left: -10000, opacity: 0 }}>{rail}</Native.View>, React.cloneElement(content, {
        style: [content.props.style, { bottom: dockHeight, left: 0, right: 0, width: "100%", borderLeftWidth: 0 }],
    }), dock] });
}

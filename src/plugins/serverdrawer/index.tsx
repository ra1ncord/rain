import { after } from "@api/patcher";
import { deleteJsxCreate, onJsxCreate } from "@api/react/jsx";
import { showToast } from "@api/ui/toasts";
import { logger } from "@lib/utils/logger";
import { findByProps, findByTypeName } from "@metro";
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
        let unpatchShade: (() => void) | undefined;
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
                bottomInset + computeGuildDockSpecs(width - 16).dockHeight - DOCK_REST_OFFSET,
                rail => <Native.View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none"
                    style={{ height: 1, width: 1, position: "absolute", left: -10000, opacity: 0 }}>{rail}</Native.View>) : rendered;
        }

        const wrapPanel = (_Original: t.PanelComponent, element: t.PanelElement) => {
            try {
                if (!DrawerSurface) {
                    const inset = findByProps("useYouBarTotalHeight");
                    if (typeof inset?.useYouBarTotalHeight !== "function") throw new Error("ServerDrawer: native YouBar inset is unavailable");

                    const shade = findByTypeName("YouBarFloatingShade");
                    if (typeof shade?.type !== "function") throw new Error("ServerDrawer: native YouBar shade is unavailable");
                    const surface = createServerDrawerSurface(createController(), abort.signal);
                    useInset = () => {
                        const height = inset.useYouBarTotalHeight();

                        return Math.max(0, Number.isFinite(height) ? height : 0);
                    };
                    unpatchShade = after("type", shade, (_args, element) => <YouBarBackdrop element={element} />);
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
            unpatchShade?.();
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

// LeftPanelContent owns a HomePanelContent rail and a container with two NativeFreezeScreens children.
export function transformLeftPanelContent(rendered: t.NativePanel, dock: React.ReactNode, dockHeight: number, hideRail: (rail: React.ReactNode) => React.ReactNode) {
    const [rail, content] = rendered.props.children;
    const screens = content.props.children;
    const children = screens.props.children.map(screen => React.cloneElement(screen, { style: [screen.props.style, { paddingBottom: dockHeight }] }));

    return React.cloneElement(rendered, { children: [hideRail(rail), React.cloneElement(content, {
        style: [content.props.style, { bottom: 0, left: 0, right: 0, width: "100%" }],
        children: React.cloneElement(screens, { children }),
    }), dock] });
}

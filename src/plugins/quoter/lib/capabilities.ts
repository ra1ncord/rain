import { logger } from "@lib/utils/logger";
import { findByProps } from "@metro";
import { Platform, UIManager } from "react-native";

export type RendererKind = "webview" | "native";

interface QuoterCapabilities {
    /** react-native-view-shot's captureRef, when Discord bundles it. */
    captureRef: ((ref: any, options: any) => Promise<string>) | null;
    /** RN core's iOS-only view snapshot API. */
    takeSnapshot: ((target: any, options: any) => Promise<string>) | null;
    /** CSS-like `filter` style (saturate for grayscale) — RN >= 0.76. */
    filterStyle: boolean;
}

let cachedCapabilities: QuoterCapabilities | null = null;

export function getCapabilities(): QuoterCapabilities {
    if (cachedCapabilities) return cachedCapabilities;

    let captureRef: QuoterCapabilities["captureRef"] = null;
    try {
        const viewShot = findByProps("captureRef");
        if (typeof viewShot?.captureRef === "function") {
            captureRef = viewShot.captureRef.bind(viewShot);
        }
    } catch { }

    const uiManager = UIManager as any;
    const takeSnapshot = typeof uiManager?.takeSnapshot === "function"
        ? uiManager.takeSnapshot.bind(uiManager)
        : null;

    const rnVersion = (Platform as any)?.constants?.reactNativeVersion;
    const filterStyle = !!rnVersion && (rnVersion.major > 0 || rnVersion.minor >= 76);

    cachedCapabilities = { captureRef, takeSnapshot, filterStyle };
    return cachedCapabilities;
}

let cachedWebView: any;
export function resolveWebView() {
    // The WebView JS module is in the shared bundle on every platform, but
    // the native RNCWebView view only exists in the Android app — mounting
    // it elsewhere crashes natively (rain's Fonts preview gates the same way).
    if (Platform.OS !== "android") return null;
    try {
        return cachedWebView ??= findByProps("WebView")?.WebView ?? null;
    } catch {
        return null;
    }
}

/**
 * Picks the quote renderer. One renderer for both platforms is not possible:
 * WebView's native view only exists in the Android app, while Android's view
 * snapshot (captureRef) fails on hardware-accelerated image bitmaps — tested
 * on-device 2026-07-12 ("Failed to snapshot view tag"). So Android uses the
 * WebView canvas and iOS uses the RN view tree + snapshot capture.
 */
export function getRendererKind(): RendererKind | null {
    if (resolveWebView()) return "webview";
    const caps = getCapabilities();
    if (caps.captureRef || caps.takeSnapshot) return "native";
    return null;
}

export function isQuoteRenderingSupported(): boolean {
    return getRendererKind() !== null;
}

export function logCapabilities() {
    try {
        const caps = getCapabilities();
        const rn = (Platform as any)?.constants?.reactNativeVersion;
        logger.log(
            `[Quoter] capabilities: platform=${Platform.OS}` +
            ` rn=${rn ? `${rn.major}.${rn.minor}.${rn.patch ?? 0}` : "?"}` +
            ` webView=${!!resolveWebView()}` +
            ` captureRef=${!!caps.captureRef}` +
            ` takeSnapshot=${!!caps.takeSnapshot}` +
            ` filterStyle=${caps.filterStyle}` +
            ` renderer=${getRendererKind() ?? "none"}`
        );
    } catch (error) {
        logger.warn("[Quoter] capability probe failed:", error);
    }
}

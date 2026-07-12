import { findNodeHandle, Image, Text, View } from "react-native";

import { getCapabilities } from "../lib/capabilities";
import { QuotePayload } from "../lib/quote";

// A stack of thin strips approximates the canvas's linear gradient without
// needing any gradient dependency; at 1200x600 the banding is invisible.
const GRADIENT_STRIPS = 32;

/**
 * The quote composed as a real React Native view tree, laid out with the
 * same geometry as the canvas renderer. Rendered offscreen at full size and
 * captured to a PNG via a snapshot API on platforms without WebView.
 */
export function NativeQuoteCanvas({ payload, canvasRef, onAvatarLoad, onAvatarError }: {
    payload: QuotePayload;
    canvasRef?: (ref: any) => void;
    onAvatarLoad?: () => void;
    onAvatarError?: () => void;
}) {
    const cfg = payload.canvas;
    const fs = payload.fonts;
    const sp = payload.spacing;
    const caps = getCapabilities();

    // Exact integer boundaries so adjacent strips neither overlap (visible
    // dark seams) nor leave gaps.
    const gradientStart = cfg.height - sp.gradientWidth;
    const stripEdge = (i: number) => gradientStart + Math.round((sp.gradientWidth * i) / GRADIENT_STRIPS);
    const grayscaleStyle = payload.grayscale && caps.filterStyle
        ? { filter: "saturate(0)" }
        : null;

    return (
        <View
            ref={canvasRef}
            collapsable={false}
            style={{ width: cfg.width, height: cfg.height, backgroundColor: "#000", overflow: "hidden" }}
        >
            <Image
                source={{ uri: payload.avatarUrl }}
                resizeMode="cover"
                onLoad={onAvatarLoad}
                onError={onAvatarError}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: cfg.height,
                    height: cfg.height,
                    ...grayscaleStyle,
                } as any}
            />
            {Array.from({ length: GRADIENT_STRIPS }, (_, i) => (
                <View
                    key={i}
                    style={{
                        position: "absolute",
                        left: stripEdge(i),
                        top: 0,
                        width: stripEdge(i + 1) - stripEdge(i),
                        height: cfg.height,
                        backgroundColor: "#000",
                        opacity: (i + 0.5) / GRADIENT_STRIPS,
                    }}
                />
            ))}
            <View
                style={{
                    position: "absolute",
                    left: cfg.quoteAreaX,
                    top: 0,
                    width: cfg.quoteAreaWidth,
                    height: cfg.height,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <Text
                    style={{
                        color: "#fff",
                        fontSize: fs.initial,
                        fontWeight: "300",
                        textAlign: "center",
                        maxHeight: cfg.maxContentHeight - 100,
                    }}
                    numberOfLines={16}
                    adjustsFontSizeToFit
                    minimumFontScale={fs.minimum / fs.initial}
                >
                    {payload.quote}
                </Text>
                <Text
                    style={{
                        color: "#fff",
                        fontSize: Math.max(fs.authorMinimum, fs.initial * fs.authorMultiplier),
                        fontStyle: "italic",
                        fontWeight: "300",
                        textAlign: "center",
                        marginTop: sp.authorTop / 2,
                    }}
                    numberOfLines={1}
                >
                    {`- ${payload.displayName}`}
                </Text>
                <Text
                    style={{
                        color: "#888",
                        fontSize: Math.max(fs.usernameMinimum, fs.initial * fs.usernameMultiplier),
                        fontWeight: "300",
                        textAlign: "center",
                        marginTop: sp.username,
                    }}
                    numberOfLines={1}
                >
                    {payload.username}
                </Text>
            </View>
            {payload.showWatermark && payload.watermark ? (
                <Text
                    style={{
                        position: "absolute",
                        right: sp.watermarkPadding,
                        bottom: sp.watermarkPadding,
                        color: "#888",
                        fontSize: fs.watermark,
                        fontWeight: "300",
                    }}
                >
                    {payload.watermark}
                </Text>
            ) : null}
        </View>
    );
}

function normalizeFileUri(uri: string): string {
    return uri.startsWith("file://") ? uri : `file://${uri}`;
}

/** Captures the rendered quote view to a PNG temp file and returns its URI. */
export async function captureQuoteView(viewRef: any, width: number, height: number): Promise<string> {
    const caps = getCapabilities();
    const errors: string[] = [];

    if (caps.captureRef) {
        const base = { format: "png", quality: 1, result: "tmpfile", width, height };
        // iOS: view-shot's default drawViewHierarchyInRect is picky about
        // view/timing state and fails with "Failed to snapshot view tag";
        // useRenderInContext rasterizes the layer tree directly and handles
        // plain Image/Text/View content reliably, so try it first. Android
        // ignores the option, so ordering is iOS-only in effect.
        for (const options of [{ ...base, useRenderInContext: true }, base]) {
            try {
                const uri = await caps.captureRef(viewRef, options);
                return normalizeFileUri(String(uri));
            } catch (error) {
                errors.push(String((error as any)?.message ?? error));
            }
        }
    }

    if (caps.takeSnapshot) {
        try {
            const target = findNodeHandle(viewRef) ?? viewRef;
            const uri = await caps.takeSnapshot(target, {
                format: "png",
                quality: 1,
                width,
                height,
            });
            return normalizeFileUri(String(uri));
        } catch (error) {
            errors.push(String((error as any)?.message ?? error));
        }
    }

    throw new Error(errors.length
        ? errors.join("; ")
        : "No screenshot capability available on this device.");
}

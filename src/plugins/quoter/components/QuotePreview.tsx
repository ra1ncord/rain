import { findAssetId } from "@api/assets";
import { dismissAlert, openAlert } from "@api/ui/alerts";
import { resolveSemanticColor, semanticColors } from "@api/ui/components/color";
import { showToast } from "@api/ui/toasts";
import { AlertActionButton, AlertActions, AlertModal, Text } from "@metro/common/components";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, Image, Platform, ScrollView, Switch, TextInput, View } from "react-native";

import { getCapabilities, getRendererKind } from "../lib/capabilities";
import { buildFileName, buildPayload, CANVAS_CONFIG, getMessageChannelId } from "../lib/quote";
import { sendQuoteAttachment, sendQuoteFile } from "../lib/send";
import { captureQuoteView, NativeQuoteCanvas } from "../renderers/native";
import { WebViewRenderer } from "../renderers/webview";
import { useQuoterSettings } from "../storage";

const ALERT_KEY = "quoter-create-quote";
const WATERMARK_DEBOUNCE_MS = 500;
// Give React Native a frame or two to commit the offscreen view before
// snapshotting it.
const CAPTURE_DELAY_MS = 80;

export type QuoteRender =
    | { kind: "dataUrl"; dataUrl: string; }
    | { kind: "file"; uri: string; };

const toggleRowStyle = {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
} as const;

function resolveColor(token: any, fallback: string): string {
    try {
        return resolveSemanticColor(token) || fallback;
    } catch {
        return fallback;
    }
}

function QuotePreview({ message, render, onRender }: {
    message: any;
    render: QuoteRender | null;
    onRender: (render: QuoteRender | null) => void;
}) {
    const settings = useQuoterSettings();
    const rendererKind = useMemo(() => getRendererKind(), []);
    const [error, setError] = useState("");
    const [avatarLoaded, setAvatarLoaded] = useState(false);
    const nativeCanvasRef = useRef<any>(null);

    const grayscale = Boolean(settings.grayscale);
    const showWatermark = Boolean(settings.showWatermark);
    const watermark = String(settings.watermark ?? "");
    // Don't render with seeded defaults while the persisted settings file is
    // still hydrating — the sent image would ignore the user's preferences.
    const hydrated = Boolean((settings as any)._hasHydrated);

    // Typing in the watermark field edits a local draft; the store (and thus
    // the expensive re-render/re-capture) only updates after a typing pause.
    const [watermarkDraft, setWatermarkDraft] = useState(watermark);
    useEffect(() => {
        if (watermarkDraft === watermark) return;
        const timer = setTimeout(
            () => settings.updateSettings({ watermark: watermarkDraft }),
            WATERMARK_DEBOUNCE_MS,
        );
        return () => clearTimeout(timer);
    }, [watermarkDraft]);

    const { renderId, payload } = useMemo(() => ({
        renderId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        payload: buildPayload(message, { grayscale, showWatermark, watermark }),
    }), [message, grayscale, showWatermark, watermark]);

    // Any input change invalidates the previous result until re-rendered.
    useEffect(() => {
        setError("");
        onRender(null);
    }, [renderId]);

    // Native renderer: snapshot the live preview view once it has committed.
    // iOS snapshots (drawViewHierarchy) only work on views that are actually
    // visible on screen, so the capture target is the scaled preview itself,
    // rendered at full 1200x600 logical size and captured at that resolution.
    useEffect(() => {
        if (rendererKind !== "native" || !hydrated || !avatarLoaded) return;

        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                if (!nativeCanvasRef.current) throw new Error("Quote view is not mounted.");
                const uri = await captureQuoteView(
                    nativeCanvasRef.current,
                    CANVAS_CONFIG.width,
                    CANVAS_CONFIG.height,
                );
                if (cancelled) return;
                setError("");
                onRender({ kind: "file", uri });
            } catch (captureError) {
                if (cancelled) return;
                const msg = captureError instanceof Error ? captureError.message : String(captureError);
                setError(`Failed to capture quote: ${msg}`);
            }
        }, CAPTURE_DELAY_MS);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [renderId, hydrated, avatarLoaded]);

    const previewWidth = Math.max(
        230,
        Math.min((Dimensions.get("window")?.width ?? 360) - 88, 420),
    );
    const previewHeight = Math.round(previewWidth * (CANVAS_CONFIG.height / CANVAS_CONFIG.width));

    const textNormal = resolveColor(semanticColors.TEXT_NORMAL, "#fff");
    const textMuted = resolveColor(semanticColors.TEXT_MUTED, "#aaa");
    const textDanger = resolveColor(semanticColors.TEXT_DANGER ?? semanticColors.STATUS_DANGER, "#f66");

    const previewUri = render?.kind === "dataUrl" ? render.dataUrl : render?.uri;
    const grayscaleUnsupported = rendererKind === "native" && grayscale
        && (Platform.OS !== "android" || !getCapabilities().filterStyle);

    return (
        <View>
            <ScrollView
                style={{ maxHeight: 470 }}
                contentContainerStyle={{ paddingTop: 10, paddingBottom: 4 }}
            >
                <View
                    style={{
                        width: previewWidth,
                        height: previewHeight,
                        alignSelf: "center",
                        borderRadius: 14,
                        overflow: "hidden",
                        backgroundColor: "#0f0f0f",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    {rendererKind === "native" && hydrated ? (
                        <View
                            pointerEvents="none"
                            style={{
                                position: "absolute",
                                left: (previewWidth - CANVAS_CONFIG.width) / 2,
                                top: (previewHeight - CANVAS_CONFIG.height) / 2,
                                transform: [{ scale: previewWidth / CANVAS_CONFIG.width }],
                            }}
                        >
                            <NativeQuoteCanvas
                                payload={payload}
                                canvasRef={ref => { nativeCanvasRef.current = ref; }}
                                onAvatarLoad={() => setAvatarLoaded(true)}
                                onAvatarError={() => setError("Failed to load avatar image.")}
                            />
                        </View>
                    ) : previewUri ? (
                        <Image
                            source={{ uri: previewUri }}
                            resizeMode="cover"
                            style={{ width: "100%", height: "100%" }}
                        />
                    ) : (
                        // The preview box is always near-black, so this stays a fixed light gray
                        <Text variant="text-xs/medium" style={{ color: "#bbb", textAlign: "center", paddingHorizontal: 12 }}>
                            {rendererKind
                                ? "Generating preview..."
                                : "Quote rendering is not supported on this device."}
                        </Text>
                    )}
                </View>
                {rendererKind === "webview" && hydrated ? (
                    <WebViewRenderer
                        payload={payload}
                        renderId={renderId}
                        onResult={dataUrl => {
                            setError("");
                            onRender({ kind: "dataUrl", dataUrl });
                        }}
                        onError={message => setError(message)}
                    />
                ) : null}
                {error ? (
                    <Text variant="text-xs/medium" style={{ color: textDanger, marginTop: 8, textAlign: "center" }}>
                        {error}
                    </Text>
                ) : null}
                <View style={toggleRowStyle}>
                    <Text variant="text-md/medium" style={{ color: textNormal }}>Grayscale</Text>
                    <Switch
                        value={grayscale}
                        onValueChange={(value: boolean) => settings.updateSettings({ grayscale: value })}
                    />
                </View>
                {grayscaleUnsupported ? (
                    <Text variant="text-xs/medium" style={{ color: textMuted, marginTop: 4 }}>
                        Grayscale may not be applied on this platform.
                    </Text>
                ) : null}
                <View style={toggleRowStyle}>
                    <Text variant="text-md/medium" style={{ color: textNormal }}>Show Watermark</Text>
                    <Switch
                        value={showWatermark}
                        onValueChange={(value: boolean) => settings.updateSettings({ showWatermark: value })}
                    />
                </View>
                {showWatermark ? (
                    <TextInput
                        value={watermarkDraft}
                        onChangeText={setWatermarkDraft}
                        placeholder="Watermark text (max 32 characters)"
                        placeholderTextColor={textMuted}
                        maxLength={32}
                        style={{
                            color: textNormal,
                            borderWidth: 1,
                            borderColor: textMuted,
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            marginTop: 10,
                        }}
                    />
                ) : null}
            </ScrollView>
        </View>
    );
}

function QuoteAlert({ message }: { message: any; }) {
    const [render, setRender] = useState<QuoteRender | null>(null);

    const onConfirm = () => {
        if (!render) {
            showToast("Quote image is not ready yet.", findAssetId("CircleXIcon"));
            return;
        }

        const channelId = getMessageChannelId(message);
        if (!channelId) {
            showToast("Unable to resolve channel.", findAssetId("CircleXIcon"));
            return;
        }

        dismissAlert(ALERT_KEY);
        const filename = buildFileName(message);
        const send = render.kind === "dataUrl"
            ? sendQuoteAttachment(channelId, render.dataUrl, filename)
            : sendQuoteFile(channelId, render.uri, filename);

        send
            .then(() => showToast("Quote sent.", findAssetId("CheckIcon")))
            .catch(error => {
                const msg = error instanceof Error ? error.message : String(error);
                showToast(`Failed to send quote: ${msg}`, findAssetId("CircleXIcon"));
            });
    };

    return (
        <AlertModal
            title="Create Quote"
            content="Preview generated from selected message"
            extraContent={
                <QuotePreview message={message} render={render} onRender={setRender} />
            }
            actions={
                <AlertActions>
                    <AlertActionButton
                        text="Send"
                        variant="primary"
                        disabled={!render}
                        onPress={onConfirm}
                    />
                    <AlertActionButton text="Cancel" variant="secondary" />
                </AlertActions>
            }
        />
    );
}

export function openQuoteModal(message: any) {
    openAlert(ALERT_KEY, <QuoteAlert message={message} />);
}

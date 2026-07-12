import { useMemo, useState } from "react";

import { resolveWebView } from "../lib/capabilities";
import { QuotePayload } from "../lib/quote";
import { buildRendererHtml } from "../lib/renderer";

/**
 * Android renderer: draws the quote on a <canvas> inside a hidden WebView
 * and reports the resulting PNG data URL through onResult.
 */
export function WebViewRenderer({ payload, renderId, onResult, onError }: {
    payload: QuotePayload;
    renderId: string;
    onResult: (dataUrl: string) => void;
    onError: (message: string) => void;
}) {
    const [WebView] = useState(() => resolveWebView());
    const html = useMemo(
        () => buildRendererHtml({ ...payload, renderId }),
        [renderId],
    );

    if (!WebView) return null;

    const onMessage = (event: any) => {
        const raw = event?.nativeEvent?.data;
        if (typeof raw !== "string") return;

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch {
            return;
        }

        if (parsed?.renderId !== renderId) return;

        if (parsed.type === "result" && typeof parsed.dataUrl === "string") {
            onResult(parsed.dataUrl);
            return;
        }

        if (parsed.type === "error") {
            onError(String(parsed.message || "Failed to render quote image."));
        }
    };

    return (
        <WebView
            key={`quote-renderer-${renderId}`}
            source={{ html, baseUrl: "https://localhost" }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onMessage={onMessage}
            style={{
                width: 1,
                height: 1,
                opacity: 0,
                position: "absolute",
                left: -9999,
                top: -9999,
            }}
        />
    );
}

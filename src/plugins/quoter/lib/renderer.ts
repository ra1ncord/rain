import { QuotePayload } from "./quote";

/**
 * Builds the HTML document rendered inside a hidden WebView. It draws the
 * quote on a <canvas> and posts the resulting PNG data URL back through
 * ReactNativeWebView.postMessage.
 *
 * The quote font is loaded from Google Fonts; rendering waits for it with a
 * timeout and gracefully falls back to sans-serif when offline.
 */
export function buildRendererHtml(payload: QuotePayload): string {
    const safePayload = JSON.stringify(payload).replace(/<\/script/gi, "<\\/script");

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
@import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@300&display=swap');
html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    background: #000;
    overflow: hidden;
}
canvas {
    width: 100%;
    height: 100%;
    display: block;
}
</style>
</head>
<body>
<canvas id="q" width="1200" height="600"></canvas>
<script>
const payload = ${safePayload};

function post(data) {
    try {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
    } catch {}
}

async function waitForFonts(font) {
    try {
        await Promise.race([
            Promise.all([
                document.fonts.load("300 42px '" + font + "'"),
                document.fonts.load("italic 300 26px '" + font + "'"),
                document.fonts.ready,
            ]),
            new Promise(resolve => setTimeout(resolve, 4000)),
        ]);
    } catch {}
}

function calculateTextLines(ctx, text, fontSize, font, maxWidth) {
    ctx.font = "300 " + fontSize + "px '" + font + "', sans-serif";
    const words = String(text || "").split(" ");
    const lines = [];
    let currentLine = [];

    for (const word of words) {
        const testLine = [...currentLine, word].join(" ");
        if (ctx.measureText(testLine).width > maxWidth && currentLine.length) {
            lines.push(currentLine.join(" "));
            currentLine = [word];
        } else {
            currentLine.push(word);
        }
    }

    if (currentLine.length) lines.push(currentLine.join(" "));
    return lines;
}

function calculateFont(ctx, quote, font, cfg, fs, sp) {
    let fontSize = fs.initial;
    while (fontSize >= fs.minimum) {
        const lines = calculateTextLines(ctx, quote, fontSize, font, cfg.quoteAreaWidth);
        const lineHeight = fontSize * fs.lineHeightMultiplier;
        const authorFontSize = Math.max(fs.authorMinimum, fontSize * fs.authorMultiplier);
        const usernameFontSize = Math.max(fs.usernameMinimum, fontSize * fs.usernameMultiplier);
        const totalHeight = (lines.length * lineHeight) + sp.authorTop + authorFontSize + sp.username + usernameFontSize;
        if (totalHeight <= cfg.maxContentHeight) {
            return { lines, fontSize, lineHeight, authorFontSize, usernameFontSize, totalHeight };
        }
        fontSize -= fs.decrement;
    }

    const lines = calculateTextLines(ctx, quote, fs.minimum, font, cfg.quoteAreaWidth);
    const lineHeight = fs.minimum * fs.lineHeightMultiplier;
    return {
        lines,
        fontSize: fs.minimum,
        lineHeight,
        authorFontSize: fs.authorMinimum,
        usernameFontSize: fs.usernameMinimum,
        totalHeight: (lines.length * lineHeight) + sp.authorTop + fs.authorMinimum + sp.username + fs.usernameMinimum,
    };
}

async function loadAvatar(url) {
    // Time-cap the fetch so a stalled connection surfaces as an error
    // instead of leaving the preview stuck on "Generating..." forever.
    const response = await Promise.race([
        fetch(url),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Avatar request timed out.")), 10000)),
    ]);
    if (!response.ok) throw new Error("Failed to fetch avatar image.");
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    try {
        return await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Failed to load avatar image."));
            img.src = blobUrl;
        });
    } finally {
        URL.revokeObjectURL(blobUrl);
    }
}

async function render() {
    const cfg = payload.canvas;
    const fs = payload.fonts;
    const sp = payload.spacing;
    const quoteFont = payload.quoteFont || "M PLUS Rounded 1c";

    await waitForFonts(quoteFont);

    const canvas = document.getElementById("q");
    canvas.width = cfg.width;
    canvas.height = cfg.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable.");

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, cfg.width, cfg.height);

    const avatar = await loadAvatar(payload.avatarUrl);
    ctx.drawImage(avatar, 0, 0, cfg.height, cfg.height);

    if (payload.grayscale) {
        ctx.globalCompositeOperation = "saturation";
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, cfg.width, cfg.height);
        ctx.globalCompositeOperation = "source-over";
    }

    const gradient = ctx.createLinearGradient(cfg.height - sp.gradientWidth, 0, cfg.height, 0);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 1)");
    ctx.fillStyle = gradient;
    ctx.fillRect(cfg.height - sp.gradientWidth, 0, sp.gradientWidth, cfg.height);

    const quote = String(payload.quote || " ");
    const calculation = calculateFont(ctx, quote, quoteFont, cfg, fs, sp);

    ctx.fillStyle = "#fff";
    ctx.font = "300 " + calculation.fontSize + "px '" + quoteFont + "', sans-serif";
    let quoteY = (cfg.height - calculation.totalHeight) / 2;
    for (const line of calculation.lines) {
        const xOffset = (cfg.quoteAreaWidth - ctx.measureText(line).width) / 2;
        quoteY += calculation.lineHeight;
        ctx.fillText(line, cfg.quoteAreaX + xOffset, quoteY);
    }

    const authorText = "- " + String(payload.displayName || "Unknown");
    ctx.font = "italic 300 " + calculation.authorFontSize + "px '" + quoteFont + "', sans-serif";
    ctx.fillStyle = "#fff";
    const authorX = cfg.quoteAreaX + (cfg.quoteAreaWidth - ctx.measureText(authorText).width) / 2;
    const authorY = quoteY + sp.authorTop;
    ctx.fillText(authorText, authorX, authorY);

    const usernameText = String(payload.username || "@unknown");
    ctx.font = "300 " + calculation.usernameFontSize + "px '" + quoteFont + "', sans-serif";
    ctx.fillStyle = "#888";
    const usernameX = cfg.quoteAreaX + (cfg.quoteAreaWidth - ctx.measureText(usernameText).width) / 2;
    const usernameY = authorY + sp.username + calculation.usernameFontSize;
    ctx.fillText(usernameText, usernameX, usernameY);

    if (payload.showWatermark && payload.watermark) {
        const watermarkText = String(payload.watermark).slice(0, 32);
        ctx.fillStyle = "#888";
        ctx.font = "300 " + fs.watermark + "px '" + quoteFont + "', sans-serif";
        const watermarkX = cfg.width - ctx.measureText(watermarkText).width - sp.watermarkPadding;
        const watermarkY = cfg.height - sp.watermarkPadding;
        ctx.fillText(watermarkText, watermarkX, watermarkY);
    }

    const dataUrl = canvas.toDataURL("image/png");
    post({ type: "result", dataUrl, renderId: payload.renderId });
}

render().catch(error => {
    post({
        type: "error",
        renderId: payload.renderId,
        message: String(error && error.message ? error.message : error),
    });
});
</script>
</body>
</html>`;
}

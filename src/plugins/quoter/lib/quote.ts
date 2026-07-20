import { findByProps } from "@metro";
import { UserStore } from "@metro/common/stores";

import { QuoterSettings } from "../storage";

// Resolved on first use rather than at plugin-import time, so a disabled
// plugin adds no metro lookups to startup.
let _userStore: any;
const getUserStore = () => _userStore ??= UserStore;
let _avatarUtils: any;
const getAvatarUtils = () => _avatarUtils ??= findByProps("getUserAvatarURL");

export const CANVAS_CONFIG = {
    width: 1200,
    height: 600,
    quoteAreaWidth: 520,
    quoteAreaX: 640,
    maxContentHeight: 480,
};

const FONT_SIZES = {
    initial: 42,
    minimum: 18,
    decrement: 2,
    lineHeightMultiplier: 1.25,
    authorMultiplier: 0.6,
    usernameMultiplier: 0.45,
    authorMinimum: 22,
    usernameMinimum: 18,
    watermark: 18,
};

const SPACING = {
    authorTop: 60,
    username: 10,
    gradientWidth: 400,
    watermarkPadding: 20,
};

export interface QuotePayload {
    quote: string;
    displayName: string;
    username: string;
    avatarUrl: string;
    grayscale: boolean;
    showWatermark: boolean;
    watermark: string;
    quoteFont: string;
    canvas: typeof CANVAS_CONFIG;
    fonts: typeof FONT_SIZES;
    spacing: typeof SPACING;
    renderId?: string;
}

function normalizeText(text: unknown): string {
    if (!text) return "";
    return String(text).replace(/\s+/g, " ").trim();
}

function sizeUpgrade(url: string): string {
    if (!url || typeof url !== "string") return "";
    try {
        const parsed = new URL(url);
        parsed.searchParams.set("size", "512");
        if (parsed.hostname === "cdn.discordapp.com" || parsed.hostname === "media.discordapp.net") {
            parsed.pathname = parsed.pathname.replace(/\.(webp|gif|jpg|jpeg)$/i, ".png");
            parsed.searchParams.set("format", "png");
        }
        return parsed.toString();
    } catch {
        return url;
    }
}

export function fixUpQuote(rawQuote: unknown): string {
    let result = String(rawQuote ?? "").replace(/<a?:(\w+):(\d+)>/g, "");
    const mentionMatches = result.match(/<@!?\d+>/g);
    if (!mentionMatches) return normalizeText(result);

    for (const match of mentionMatches) {
        const userId = match.replace(/[<@!>]/g, "");
        const user = getUserStore()?.getUser?.(userId);
        if (user?.username) {
            result = result.replace(match, `@${user.username}`);
        }
    }

    return normalizeText(result);
}

function getMessageAuthor(message: any) {
    return message?.author ?? {};
}

function getDisplayName(author: any): string {
    return author?.globalName || author?.global_name || author?.username || "Unknown";
}

function getAuthorUsername(author: any): string {
    return String(author?.username || "unknown").replace(/[^\w.-]/g, "").slice(0, 32) || "unknown";
}

function getAvatarUrl(author: any): string {
    try {
        if (typeof author?.getAvatarURL === "function") {
            return sizeUpgrade(author.getAvatarURL());
        }
    } catch { }

    try {
        const avatarUtils = getAvatarUtils();
        if (typeof avatarUtils?.getUserAvatarURL === "function") {
            return sizeUpgrade(avatarUtils.getUserAvatarURL(author, false));
        }
    } catch { }

    if (author?.id && author?.avatar) {
        return `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.png?size=512`;
    }

    return "https://cdn.discordapp.com/embed/avatars/0.png?size=512";
}

export function getMessageChannelId(message: any): string | null {
    return message?.channel_id || message?.channelId || message?.channel?.id || null;
}

export function buildFileName(message: any): string {
    const content = fixUpQuote(message?.content || "");
    const preview = content.split(" ").filter(Boolean).slice(0, 6).join(" ");
    const safePreview = (preview || "quote").replace(/[^\w.-]/g, "_").slice(0, 48);
    const username = getAuthorUsername(getMessageAuthor(message));
    return `${safePreview}-${username}.png`;
}

export function buildPayload(message: any, options: QuoterSettings): QuotePayload {
    const author = getMessageAuthor(message);
    return {
        quote: fixUpQuote(message?.content || "").slice(0, 420) || " ",
        displayName: getDisplayName(author).slice(0, 64),
        username: `@${getAuthorUsername(author)}`,
        avatarUrl: getAvatarUrl(author),
        grayscale: Boolean(options.grayscale),
        showWatermark: Boolean(options.showWatermark),
        watermark: String(options.watermark || "").slice(0, 32),
        quoteFont: "M PLUS Rounded 1c",
        canvas: CANVAS_CONFIG,
        fonts: FONT_SIZES,
        spacing: SPACING,
    };
}

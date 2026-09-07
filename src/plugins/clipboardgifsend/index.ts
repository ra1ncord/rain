import { before, instead } from "@api/patcher";
import { showToast } from "@api/ui/toasts";
import { findByPropsLazy } from "@metro";
import { clipboard } from "@metro/common";
import { definePlugin } from "@plugins";
import { Contributors } from "@rain/Developers";

const GifAnalytics = findByPropsLazy("trackSelectGIF");
const MessageActions = findByPropsLazy("sendMessage", "receiveMessage");
const patches: (() => void)[] = [];
let selectionExpiresAt = 0;

function gifUrl(content: unknown): string | undefined {
    if (typeof content !== "string") return;
    const text = content.trim();
    if (!text || /\s/.test(text)) return;

    let url: URL;
    try {
        url = new URL(text);
    } catch {
        return;
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") return;
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();
    const isHost = (domain: string) => host === domain || host.endsWith(`.${domain}`);

    if (path.endsWith(".gif")
        || ["tenor.com", "giphy.com", "klipy.com"].some(isHost)
        || (["cdn.discordapp.com", "media.discordapp.net"].some(isHost) && path.startsWith("/attachments/"))) {
        return text;
    }
}

export default definePlugin({
    name: "ClipboardGIFSend",
    description: "Copy GIF picker links to the clipboard instead of sending them",
    author: [Contributors.benjii],
    id: "clipboardgifsend",
    version: "1.0.0",
    start() {
        patches.push(
            before("trackSelectGIF", GifAnalytics, () => {
                selectionExpiresAt = Date.now() + 500;
            }),
            instead("sendMessage", MessageActions, (args, original) => {
                if (!selectionExpiresAt || Date.now() > selectionExpiresAt) {
                    selectionExpiresAt = 0;
                    return original(...args);
                }

                const url = gifUrl(args[1]?.content);
                if (!url) return original(...args);

                selectionExpiresAt = 0;
                clipboard.setString(url);
                showToast.showCopyToClipboard("GIF link copied.");
            }),
        );
    },
    stop() {
        for (const unpatch of patches) unpatch();
        patches.length = 0;
        selectionExpiresAt = 0;
    },
});

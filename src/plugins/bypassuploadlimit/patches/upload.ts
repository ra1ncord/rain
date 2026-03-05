import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import { logger } from "@lib/utils/logger";
import { findByProps } from "@metro";
import { clipboard } from "@metro/common";
import { findByProps as findByPropsWrappers } from "@metro/wrappers";

// For robust chat input manipulation
let getChatInputRef: ((channelId: string, idx?: number) => any) | null = null;
import { uploadToCatbox } from "../api/catbox";
import { uploadToLitterbox } from "../api/litterbox";
import { uploadToUguu } from "../api/uguu";
import { uploadToZipline } from "../api/zipline";
import { formatBytes } from "../lib/utils";
import { uploaderSettings } from "../storage";

const CloudUpload = findByProps("CloudUpload")?.CloudUpload;
const MessageSender = findByProps("sendMessage");
const PendingMessages = findByProps("getPendingMessages", "deletePendingMessage");

/** Cleans up any failed pending messages in the channel after an upload. */
function cleanupPendingMessages(channelId: string) {
    try {
        const pending = PendingMessages?.getPendingMessages?.(channelId);
        if (!pending) return;
        for (const [messageId, message] of Object.entries(pending) as [string, any][]) {
            if (message.state === "FAILED") {
                PendingMessages.deletePendingMessage(channelId, messageId);
            }
        }
    } catch (err) {
        logger.warn("[Uploader] Failed to clean up pending messages:", err);
    }
}

export default function getUploaderPatch(): (() => boolean)[] {
    // Resolve getChatInputRef for robust chat input manipulation
    if (!getChatInputRef) {
        try {
            getChatInputRef = findByProps("getChatInputRef")?.getChatInputRef ?? null;
        } catch {}
    }
    if (!CloudUpload?.prototype) {
        logger.error("[Uploader] Could not find CloudUpload — upload patching skipped.");
        return [];
    }

    const original = CloudUpload.prototype.reactNativeCompressAndExtractData;

    CloudUpload.prototype.reactNativeCompressAndExtractData = async function (...args: any[]) {
        const file = this;
        const size: number = file?.preCompressionSize ?? 0;
        const readableSize = formatBytes(size);

        const { alwaysUpload, useHyperlink, selectedHost, userHash, uploadAction, litterboxDuration, ziplineServerURL, ziplineUserToken, ziplineDuration, ziplineFileNameFormat} = uploaderSettings;
        let useHost = selectedHost;

        // Automatically fall back to Litterbox when the file is too large for Catbox (200 MB)
        const CATBOX_LIMIT = 200 * 1024 * 1024;
        if (useHost === "catbox" && size > CATBOX_LIMIT) {
            useHost = "litterbox";
            logger.info("[Uploader] File exceeds Catbox limit, falling back to Litterbox.");
        }

        // Hard cap: Catbox max 1 GB, Uguu max 128 MB
        if ((useHost === "catbox" || useHost === "litterbox") && size > 1024 * 1024 * 1024) {
            showToast("File too large — maximum supported size is 1 GB.", findAssetId("CircleXIcon"));
            return null;
        }
        if (useHost === "uguu" && size > 128 * 1024 * 1024) {
            showToast("File too large — Uguu max size is 128 MB.", findAssetId("CircleXIcon"));
            return null;
        }

        const DISCORD_LIMIT = 8 * 1024 * 1024; // 8 MB (free tier)
        const shouldUpload = alwaysUpload || size > DISCORD_LIMIT;

        if (!shouldUpload) return original.apply(this, args);

        const hostLabel = useHost.charAt(0).toUpperCase() + useHost.slice(1);
        showToast(`Uploading ${readableSize} to ${hostLabel}...`, findAssetId("UploadIcon"));

        const channelId: string = file?.channelId ?? "";

        let link: string | null = null;
        let uploadError: any = null;
        try {
            switch (useHost) {
                case "catbox":
                    link = await uploadToCatbox(file, userHash);
                    break;
                case "litterbox":
                    link = await uploadToLitterbox(file, `${litterboxDuration}h`);
                    break;
                case "uguu":
                    link = await uploadToUguu(file);
                    break;
                case "zipline":
                    link = await uploadToZipline(file, ziplineServerURL, ziplineUserToken, ziplineDuration, ziplineFileNameFormat)
                    break
            }
        } catch (err) {
            uploadError = err;
            logger.error("[Uploader] Upload threw error:", err);
        }
        // Always cancel the original Discord upload
        if (typeof file.setStatus === "function") file.setStatus("CANCELED");
        // Mark the file/message as canceled by uploader for MessageLogger
        if (file && typeof file === "object") file.__rainenhancements = "upload-canceled";
        if (channelId) setTimeout(() => cleanupPendingMessages(channelId), 500);

        if (link) {
            const filename = file?.filename ?? "file";
            // Use a markdown hyperlink so the filename is shown in chat
            const content = useHyperlink
                ? `[${filename}](${link})`
                : link;

            if (uploadAction === "clipboard") {
                clipboard.setString(link);
                showToast("Uploaded and link copied to clipboard!", findAssetId("toast_copy_link"));
            } else if (uploadAction === "insertonly") {
                // Insert into input only, do not send
                let inserted = false;
                if (getChatInputRef && channelId) {
                    try {
                        const chatInputRef = getChatInputRef(channelId, 0);
                        if (chatInputRef?.insertText) {
                            chatInputRef.insertText(content);
                            inserted = true;
                            showToast("Link inserted into chat box!", findAssetId("toast_copy_link"));
                        }
                    } catch (err) {
                        logger.error("[Uploader] Error inserting into chat input:", err);
                    }
                }
                if (!inserted) {
                    // Fallback to legacy method
                    const ChatInputRef = (findByPropsWrappers || findByProps)("insertText");
                    if (ChatInputRef?.insertText) {
                        ChatInputRef.insertText(content);
                        showToast("Link inserted into chat box! (fallback)", findAssetId("toast_copy_link"));
                    } else {
                        showToast("Could not insert into chat box.", findAssetId("CircleXIcon"));
                    }
                }
            } else if (uploadAction === "insert") {
                // Always send the message programmatically for 'insert and send'
                if (channelId && MessageSender?.sendMessage) {
                    try {
                        const nonce = Date.now().toString();
                        await MessageSender.sendMessage(channelId, { content }, void 0, { nonce });
                        showToast("Uploaded and link sent to chat!", findAssetId("CheckIcon"));
                    } catch (sendErr) {
                        logger.error("[Uploader] Failed to send message after upload (insert and send):", sendErr);
                        showToast("Upload succeeded but failed to send message.", findAssetId("CircleXIcon"));
                    }
                } else {
                    showToast("Could not send message to chat.", findAssetId("CircleXIcon"));
                }
            } else if (uploadAction === "nextmsg") {
                // Fallback: use the pendingInsertLink patch
                pendingInsertLink = content;
                showToast("Link will be appended to your next message.", findAssetId("toast_copy_link"));
            } else {
                // Default: send immediately
                if (channelId && MessageSender?.sendMessage) {
                    try {
                        const nonce = Date.now().toString();
                        await MessageSender.sendMessage(channelId, { content }, void 0, { nonce });
                        showToast("Uploaded and link sent to chat!", findAssetId("CheckIcon"));
                    } catch (sendErr) {
                        logger.error("[Uploader] Failed to send message after upload:", sendErr);
                        showToast("Upload succeeded but failed to send message.", findAssetId("CircleXIcon"));
                    }
                }
            }
        } else {
            if (uploadError) {
                showToast("Upload failed: " + (uploadError?.message || uploadError), findAssetId("CircleXIcon"));
            } else {
                showToast("Upload failed — check the console for details.", findAssetId("CircleXIcon"));
            }
            logger.error("[Uploader] Upload returned null or failed.", uploadError);
        }
        // Always return null to signal completion to Discord
        return null;
    };

    const unpatch = () => {
        CloudUpload.prototype.reactNativeCompressAndExtractData = original;
        return true;
    };

    // Patch sendMessage to support the "insert link" mode
    const sendMessagePatch = patchSendMessage();

    return [unpatch, sendMessagePatch];
}

// Module-level variable to hold a pending link for the "insert" mode
let pendingInsertLink: string | null = null;

function patchSendMessage(): () => boolean {
    const original = MessageSender?.sendMessage;
    if (!original) return () => true;

    MessageSender.sendMessage = function (...args: any[]) {
        const message = args[1];
        if (pendingInsertLink && message?.content !== undefined) {
            message.content = message.content
                ? `${message.content}\n${pendingInsertLink}`
                : pendingInsertLink;
            pendingInsertLink = null;
        }
        return original.apply(this, args);
    };

    return () => {
        MessageSender.sendMessage = original;
        return true;
    };
}

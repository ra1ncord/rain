import { logger } from "@lib/utils/logger";

const CATBOX_API = "https://catbox.moe/user/api.php";

/**
 * Uploads a file to Catbox.moe.
 *
 * @param file    The CloudUpload file object from Discord's internals.
 * @param userHash  Optional Catbox user hash for persistent account-linked storage.
 * @returns The URL of the uploaded file, or null on failure.
 */
export async function uploadToCatbox(file: any, userHash?: string): Promise<string | null> {
    try {
        const fileUri: string | undefined =
            file?.item?.originalUri ??
            file?.uri ??
            file?.fileUri ??
            file?.path ??
            file?.sourceURL;

        if (!fileUri) throw new Error("Could not resolve a file URI from the upload object.");

        const formData = new FormData();
        formData.append("reqtype", "fileupload");
        if (userHash?.trim()) formData.append("userhash", userHash.trim());
        formData.append("fileToUpload", {
            uri: fileUri,
            name: file.filename ?? "upload",
            type: file.mimeType ?? "application/octet-stream",
        } as any);

        const response = await fetch(CATBOX_API, { method: "POST", body: formData });
        const text = await response.text();

        if (!text.startsWith("https://")) {
            throw new Error(`Unexpected response from Catbox: ${text}`);
        }

        return text.trim();
    } catch (err) {
        logger.error("[Uploader/Catbox] Upload failed:", err);
        return null;
    }
}

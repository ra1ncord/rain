import { logger } from "@lib/utils/logger";

const LITTERBOX_API = "https://litterbox.catbox.moe/resources/internals/api.php";

/** Valid Litterbox expiry durations. */
export type LitterboxDuration = "1h" | "12h" | "24h" | "72h";

/**
 * Uploads a file to Litterbox (temporary Catbox storage).
 *
 * @param file      The CloudUpload file object from Discord's internals.
 * @param duration  How long the file should be kept before expiry. Defaults to "1h".
 * @returns The URL of the uploaded file, or null on failure.
 */
export async function uploadToLitterbox(
    file: any,
    duration: LitterboxDuration | string = "1h",
): Promise<string | null> {
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
        formData.append("time", duration);
        formData.append("fileToUpload", {
            uri: fileUri,
            name: file.filename ?? "upload",
            type: file.mimeType ?? "application/octet-stream",
        } as any);

        const response = await fetch(LITTERBOX_API, { method: "POST", body: formData });
        const text = await response.text();

        if (!text.startsWith("https://")) {
            throw new Error(`Unexpected response from Litterbox: ${text}`);
        }

        return text.trim();
    } catch (err) {
        logger.error("[Uploader/Litterbox] Upload failed:", err);
        return null;
    }
}

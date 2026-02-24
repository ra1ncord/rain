import { logger } from "@lib/utils/logger";

const UGUU_API = "https://uguu.se/upload.php";

/**
 * Uploads a file to uguu.se.
 *
 * @param file  The CloudUpload file object from Discord's internals.
 * @returns The URL of the uploaded file, or null on failure.
 */
export async function uploadToUguu(file: any): Promise<string | null> {
    try {
        const fileUri: string | undefined =
            file?.item?.originalUri ??
            file?.uri ??
            file?.fileUri ??
            file?.path ??
            file?.sourceURL;

        if (!fileUri) throw new Error("Could not resolve a file URI from the upload object.");

        const formData = new FormData();
        formData.append("files[]", {
            uri: fileUri,
            name: file.filename ?? "upload",
            type: file.mimeType ?? "application/octet-stream",
        } as any);

        const response = await fetch(UGUU_API, { method: "POST", body: formData });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const json = await response.json();

        if (!json?.success) {
            throw new Error(json?.error ?? "Unknown error from Uguu.");
        }

        const url: string | undefined = json?.files?.[0]?.url;
        if (!url) throw new Error("No URL in Uguu response.");

        return url;
    } catch (err) {
        logger.error("[Uploader/Uguu] Upload failed:", err);
        return null;
    }
}

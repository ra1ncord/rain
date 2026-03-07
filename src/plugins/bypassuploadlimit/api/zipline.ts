import { logger } from "@lib/utils/logger";

/**
 * Uploads a file to Zipline.
 *
 * @param file    The CloudUpload file object from Discord's internals.
 * @param ziplineServerURL  The Zipline server to upload to.
 * @param ziplineUserToken  The Zipline account token.
 * @param ziplineDuration   How long the file should be kept before expiring. Default "never".
 * @param ziplineFileName   File name, I'm lazy to add a comment. Default "date".
 * @returns The URL of the uploaded file, or null on failure.
 */

export type ZiplineDuration = "never" | "1h" | "12h" | "1d" | "3d";

export async function uploadToZipline(
    file: any, 
    ziplineServerURL: string, 
    ziplineUserToken: string,
    ziplineDuration: ZiplineDuration | string = "never",
    ziplineFileNameFormat: string | string = "date",
): Promise<string | null> {
    try {
        if (!ziplineServerURL) throw new Error("Missing Zipline server URL");
        if (!ziplineUserToken) throw new Error("Missing Zipline token");

        const fileUri: string | undefined =
            file?.item?.originalUri ??
            file?.uri ??
            file?.fileUri ??
            file?.path ??
            file?.sourceURL;

        if (!fileUri) throw new Error("Could not resolve a file URI from the upload object.");

        const formData = new FormData();
        formData.append("file", {
            uri: fileUri,
            name: file.filename ?? "upload",
            type: file.mimeType ?? "application/octet-stream",
        } as any);

        const headers: Record<string, string> = {
            authorization: ziplineUserToken,
            "x-zipline-format": ziplineFileNameFormat,
        };

        if (ziplineDuration !== "never") {
            headers["x-zipline-deletes-at"] = ziplineDuration;
        }

        const uploadURL = new URL("/api/upload", ziplineServerURL).toString();
        const response = await fetch(uploadURL, {
            method: "POST",
            headers,
            body: formData,
        });

        const json = await response.json();
        const uploadedUrl: string | undefined = json?.files?.[0]?.url;
        if (!uploadedUrl) throw new Error("No URL in Zipline response.");

        return uploadedUrl.trim();
    } catch (err) {
        logger.error("[Uploader/Zipline] Upload failed:", err);
        return null;
    }
}

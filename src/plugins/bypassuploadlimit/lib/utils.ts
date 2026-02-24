/**
 * Formats a byte count into a human-readable string (e.g. "4.20 MB").
 */
export function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = Math.max(0, decimals);
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

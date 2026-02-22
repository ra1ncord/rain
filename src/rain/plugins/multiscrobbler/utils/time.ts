// Convert seconds to MM:SS format
export function formatTime(seconds: number): string {
    if (!seconds || seconds < 0) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// Convert milliseconds to MM:SS format
export function formatTimeFromMs(milliseconds: number): string {
    return formatTime(Math.floor(milliseconds / 1000));
}

// Format duration with hours if it's a long track
export function formatDuration(seconds: number): string {
    if (!seconds || seconds < 0) return "0:00";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    }

    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// Convert timestamp to ISO date string
export function timestampToISO(timestamp: number): string {
    return new Date(timestamp * 1000).toISOString();
}

// Get current time as Unix timestamp
export function getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000);
}

// Figure out how far through a track we are (0-100%)
export function calculateProgress(
    startTime: number,
    endTime?: number,
    currentTime: number = getCurrentTimestamp(),
): number {
    if (!endTime || endTime <= startTime) return 0;

    const elapsed = currentTime - startTime;
    const total = endTime - startTime;

    if (elapsed <= 0) return 0;
    if (elapsed >= total) return 100;

    return Math.round((elapsed / total) * 100);
}

// How much time is left in the track
export function formatTimeRemaining(
    startTime: number,
    endTime: number,
    currentTime: number = getCurrentTimestamp(),
): string {
    const remaining = endTime - currentTime;
    if (remaining <= 0) return "0:00";

    return formatTime(remaining);
}

// How much time has passed since the track started
export function formatElapsedTime(
    startTime: number,
    currentTime: number = getCurrentTimestamp(),
): string {
    const elapsed = currentTime - startTime;
    if (elapsed <= 0) return "0:00";

    return formatTime(elapsed);
}

// Check if timestamps make sense
export function validateTimestamps(
    startTime: number,
    endTime?: number,
): boolean {
    const now = getCurrentTimestamp();
    const oneWeekAgo = now - 7 * 24 * 60 * 60;
    const twoHoursFuture = now + 2 * 60 * 60;

    // Make sure start time isn't crazy old or in the future
    // Allow some wiggle room for tracks that just started
    const twoHoursAgo = now - 2 * 60 * 60;
    if (startTime < oneWeekAgo || startTime > twoHoursFuture) {
        if (startTime >= twoHoursAgo && startTime <= now + 300) {
            // allow 5 minutes in the future for "now playing"
            return true;
        }
        return false;
    }

    // if we have an end time, make sure it makes sense
    if (endTime !== undefined) {
        if (endTime <= startTime) return false;

        const duration = endTime - startTime;
        const maxDuration = 2 * 60 * 60;

        if (duration > maxDuration) return false;
    }

    return true;
}

// Turn timestamp into "2 minutes ago" style text
export function formatRelativeTime(timestamp: number): string {
    const now = getCurrentTimestamp();
    const diff = now - timestamp;

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;

    return new Date(timestamp * 1000).toLocaleDateString();
}

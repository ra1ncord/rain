import { logger } from "@lib/utils/logger";

import { profilecolorSettings } from "./storage";

// Cache for registry-resolved profile colors (Discord ID → { primary, accent } | null)
const colorCache = new Map<string, { colors: { primary: number; accent: number } | null; fetchedAt: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Look up a user's profile colors from the public registry.
 * Returns { primary, accent } as integer numbers, or null.
 */
export async function fetchRegistryColors(userId: string): Promise<{ primary: number; accent: number } | null> {
    const cached = colorCache.get(userId);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
        return cached.colors;
    }

    const registryUrl = profilecolorSettings.registryUrl;
    if (!registryUrl) return null;

    try {
        const res = await fetch(`${registryUrl}/lookup/${userId}`);
        if (!res.ok) {
            colorCache.set(userId, { colors: null, fetchedAt: Date.now() });
            return null;
        }
        const data = await res.json();
        const primary = data?.primary;
        const accent = data?.accent;

        if (!primary || !accent) {
            colorCache.set(userId, { colors: null, fetchedAt: Date.now() });
            return null;
        }

        // Convert "#rrggbb" hex strings to integer
        const primaryNum = parseInt(primary.replace("#", ""), 16);
        const accentNum = parseInt(accent.replace("#", ""), 16);

        if (isNaN(primaryNum) || isNaN(accentNum)) {
            colorCache.set(userId, { colors: null, fetchedAt: Date.now() });
            return null;
        }

        const result = { primary: primaryNum, accent: accentNum };
        colorCache.set(userId, { colors: result, fetchedAt: Date.now() });
        return result;
    } catch (e) {
        logger.error("FakeProfileColors", "Failed to fetch registry colors", e);
        colorCache.set(userId, { colors: null, fetchedAt: Date.now() });
        return null;
    }
}

/**
 * Publish your profile colors to the registry.
 * Only sends Discord user ID + two hex color strings. No tokens.
 */
export async function publishToRegistry(discordId: string, primary: number, accent: number): Promise<boolean> {
    const registryUrl = profilecolorSettings.registryUrl;
    if (!registryUrl || !discordId) return false;

    const primaryHex = `#${primary.toString(16).padStart(6, "0")}`;
    const accentHex = `#${accent.toString(16).padStart(6, "0")}`;

    try {
        const res = await fetch(`${registryUrl}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ discordId, primary: primaryHex, accent: accentHex }),
        });
        if (res.ok) {
            // Update cache immediately
            colorCache.set(discordId, { colors: { primary, accent }, fetchedAt: Date.now() });
        }
        return res.ok;
    } catch {
        return false;
    }
}

/**
 * Remove your colors from the registry.
 */
export async function unpublishFromRegistry(discordId: string): Promise<boolean> {
    const registryUrl = profilecolorSettings.registryUrl;
    if (!registryUrl || !discordId) return false;

    try {
        const res = await fetch(`${registryUrl}/register`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ discordId }),
        });
        if (res.ok) {
            colorCache.delete(discordId);
        }
        return res.ok;
    } catch {
        return false;
    }
}

/** Clear the in-memory color cache. */
export function clearColorCache(): void {
    colorCache.clear();
}

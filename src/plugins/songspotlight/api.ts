import { logger } from "@lib/utils/logger";

import { songSpotlightSettings } from "./storage";
import { LastFmTopTracksResponse, TopTrack } from "./types";

const LASTFM_BASE_URL = "https://ws.audioscrobbler.com/2.0";

// Cache for registry-resolved Last.fm usernames (Discord ID → Last.fm username | null)
const registryCache = new Map<string, { username: string | null; fetchedAt: number }>();
const REGISTRY_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCredentials(): { username: string; apiKey: string } | null {
    const { username, apiKey } = songSpotlightSettings;
    if (username && apiKey) {
        return { username, apiKey };
    }
    return null;
}

export function hasCredentials(): boolean {
    return getCredentials() !== null;
}

export function getUsername(): string | null {
    return getCredentials()?.username ?? null;
}

/**
 * Extract a Last.fm username from a user's bio/about me text.
 * Looks for patterns like:
 *   last.fm/user/USERNAME
 *   www.last.fm/user/USERNAME
 *   lastfm.com/user/USERNAME
 */
export function parseLastFmFromBio(bio: string | null | undefined): string | null {
    if (!bio) return null;
    const match = bio.match(/(?:(?:www\.)?last\.?fm\.com?\/user\/|last\.fm\/user\/)([\w-]+)/i);
    return match?.[1] ?? null;
}

/**
 * Look up a user's Last.fm username from the public registry.
 */
async function fetchRegistryUsername(userId: string): Promise<string | null> {
    const cached = registryCache.get(userId);
    if (cached && Date.now() - cached.fetchedAt < REGISTRY_CACHE_TTL) {
        return cached.username;
    }

    const registryUrl = songSpotlightSettings.registryUrl;
    if (!registryUrl) return null;

    try {
        const res = await fetch(`${registryUrl}/lookup/${userId}`);
        if (!res.ok) {
            registryCache.set(userId, { username: null, fetchedAt: Date.now() });
            return null;
        }
        const data = await res.json();
        const username = data?.lastfm || null;
        registryCache.set(userId, { username, fetchedAt: Date.now() });
        return username;
    } catch {
        registryCache.set(userId, { username: null, fetchedAt: Date.now() });
        return null;
    }
}

/**
 * Publish your Discord ID → Last.fm username mapping to the registry.
 * Only sends your public Discord user ID + Last.fm username. No tokens.
 */
export async function publishToRegistry(discordId: string): Promise<boolean> {
    const registryUrl = songSpotlightSettings.registryUrl;
    const username = songSpotlightSettings.username;
    if (!registryUrl || !username || !discordId) return false;

    try {
        const res = await fetch(`${registryUrl}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ discordId, lastfm: username }),
        });
        return res.ok;
    } catch {
        return false;
    }
}

/**
 * Remove your mapping from the registry.
 */
export async function unpublishFromRegistry(discordId: string): Promise<boolean> {
    const registryUrl = songSpotlightSettings.registryUrl;
    if (!registryUrl || !discordId) return false;

    try {
        const res = await fetch(`${registryUrl}/register`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ discordId }),
        });
        return res.ok;
    } catch {
        return false;
    }
}

/**
 * Resolve the Last.fm username for a given Discord user ID.
 * Priority: own profile configured username > registry lookup > bio parsing
 */
export async function resolveLastFmUsername(
    userId: string,
    isOwnProfile: boolean,
    bio?: string | null,
): Promise<string | null> {
    // 1. For own profile, use configured username
    if (isOwnProfile) return getUsername();

    // 2. Check the public registry
    const registryUsername = await fetchRegistryUsername(userId);
    if (registryUsername) return registryUsername;

    // 3. Check bio for Last.fm link as fallback
    const bioUsername = parseLastFmFromBio(bio);
    if (bioUsername) return bioUsername;

    return null;
}

export async function testConnection(): Promise<boolean> {
    const creds = getCredentials();
    if (!creds) return false;

    try {
        const params = new URLSearchParams({
            method: "user.getinfo",
            user: creds.username,
            api_key: creds.apiKey,
            format: "json",
        });
        const res = await fetch(`${LASTFM_BASE_URL}?${params}`);
        const data = await res.json();
        return !data.error;
    } catch {
        return false;
    }
}

export interface LastFmUserInfo {
    name: string;
    url: string;
    avatar: string | null;
}

// Cache for Last.fm user info
const userInfoCache = new Map<string, { info: LastFmUserInfo | null; fetchedAt: number }>();
const USER_INFO_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch a Last.fm user's profile info (display name, avatar, profile URL).
 */
export async function fetchLastFmUserInfo(lastFmUsername: string): Promise<LastFmUserInfo | null> {
    const cached = userInfoCache.get(lastFmUsername);
    if (cached && Date.now() - cached.fetchedAt < USER_INFO_CACHE_TTL) {
        return cached.info;
    }

    const creds = getCredentials();
    if (!creds) return null;

    try {
        const params = new URLSearchParams({
            method: "user.getinfo",
            user: lastFmUsername,
            api_key: creds.apiKey,
            format: "json",
        });
        const res = await fetch(`${LASTFM_BASE_URL}?${params}`);
        const data = await res.json();

        if (data.error || !data.user) {
            userInfoCache.set(lastFmUsername, { info: null, fetchedAt: Date.now() });
            return null;
        }

        const images = data.user.image;
        // Pick the largest available image
        let avatar: string | null = null;
        if (Array.isArray(images)) {
            for (const size of ["extralarge", "large", "medium", "small"]) {
                const img = images.find((i: any) => i.size === size);
                if (img?.["#text"]) {
                    avatar = img["#text"];
                    break;
                }
            }
        }

        const info: LastFmUserInfo = {
            name: data.user.name || lastFmUsername,
            url: data.user.url || `https://www.last.fm/user/${lastFmUsername}`,
            avatar,
        };

        userInfoCache.set(lastFmUsername, { info, fetchedAt: Date.now() });
        return info;
    } catch {
        userInfoCache.set(lastFmUsername, { info: null, fetchedAt: Date.now() });
        return null;
    }
}

async function fetchITunesInfo(artist: string, track: string): Promise<{ art: string | null; album: string }> {
    const attempts = [
        `${track} ${artist}`,
        `${artist} ${track}`,
        track.length <= 4 ? `${artist} - ${track}` : null,
    ].filter(Boolean) as string[];

    for (const query of attempts) {
        try {
            const params = new URLSearchParams({
                term: query,
                entity: "song",
                limit: "10",
            });
            const res = await fetch(`https://itunes.apple.com/search?${params}`);
            const data = await res.json();
            const results = data?.results;
            if (!results?.length) continue;

            const artistLower = artist.toLowerCase();
            const trackLower = track.toLowerCase();

            // Best match: both artist and track name match
            const match =
                results.find((r: any) =>
                    r.artistName?.toLowerCase().includes(artistLower) &&
                    r.trackName?.toLowerCase().includes(trackLower),
                ) ||
                // Partial: artist matches
                results.find((r: any) =>
                    r.artistName?.toLowerCase().includes(artistLower),
                ) ||
                // Partial: track name matches
                results.find((r: any) =>
                    r.trackName?.toLowerCase().includes(trackLower),
                ) ||
                results[0];

            if (match) {
                return {
                    art: match.artworkUrl100?.replace("100x100", "600x600") ?? null,
                    album: match.collectionName || "",
                };
            }
        } catch { continue; }
    }
    return { art: null, album: "" };
}

// Simple in-memory cache for top tracks
const trackCache = new Map<string, { tracks: TopTrack[]; fetchedAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function clearTrackCache() {
    trackCache.clear();
}

export async function fetchTopTracks(
    username?: string,
    period?: string,
    limit?: number,
): Promise<TopTrack[]> {
    const creds = getCredentials();
    if (!creds) {
        throw new Error("No Last.fm credentials configured. Add your username and API key in Song Spotlight settings.");
    }

    const resolvedUsername = username || creds!.username;
    const resolvedPeriod = period || songSpotlightSettings.period;
    const resolvedLimit = limit || songSpotlightSettings.trackCount;

    const cacheKey = `${resolvedUsername}:${resolvedPeriod}:${resolvedLimit}`;
    const cached = trackCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
        return cached.tracks;
    }

    const params = new URLSearchParams({
        method: "user.getTopTracks",
        user: resolvedUsername,
        api_key: creds.apiKey,
        period: resolvedPeriod,
        limit: String(resolvedLimit),
        format: "json",
    });

    const url = `${LASTFM_BASE_URL}?${params}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: LastFmTopTracksResponse = await response.json();

        if (data.error) {
            throw new Error(`Last.fm API Error ${data.error}: ${data.message}`);
        }

        if (!data.toptracks?.track?.length) {
            return [];
        }

        const rawTracks = data.toptracks.track;

        const tracks: TopTrack[] = rawTracks.map(track => ({
            name: track.name,
            artist: track.artist.name,
            album: "",
            playCount: parseInt(track.playcount) || 0,
            url: track.url,
            albumArt: null,
            rank: parseInt(track["@attr"]?.rank) || 0,
        }));

        // Fetch album art + album name from iTunes
        await Promise.allSettled(
            tracks.map(async t => {
                const info = await fetchITunesInfo(t.artist, t.name);
                t.albumArt = info.art;
                if (!t.album) t.album = info.album;
            }),
        );

        trackCache.set(cacheKey, { tracks, fetchedAt: Date.now() });
        return tracks;
    } catch (error) {
        logger.error("[SongSpotlight] Failed to fetch top tracks:", error);
        throw error;
    }
}

export async function fetchRecentTracks(
    username?: string,
    limit: number = 5,
): Promise<TopTrack[]> {
    const creds = getCredentials();
    if (!creds) {
        throw new Error("No Last.fm credentials available.");
    }

    const resolvedUsername = username || creds.username;
    const cacheKey = `recent:${resolvedUsername}:${limit}`;
    const cached = trackCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
        return cached.tracks;
    }

    const params = new URLSearchParams({
        method: "user.getRecentTracks",
        user: resolvedUsername,
        api_key: creds.apiKey,
        limit: String(limit),
        format: "json",
    });

    const url = `${LASTFM_BASE_URL}?${params}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(`Last.fm API Error ${data.error}: ${data.message}`);
        }

        if (!data.recenttracks?.track?.length) {
            return [];
        }

        const tracks: TopTrack[] = data.recenttracks.track
            .filter((t: any) => t.name) // filter out empty entries
            .map((track: any, index: number) => ({
                name: track.name,
                artist: track.artist?.["#text"] || track.artist?.name || "Unknown",
                album: track.album?.["#text"] || "",
                playCount: 0,
                url: track.url || "",
                albumArt: null,
                rank: index + 1,
            }));

        // Fetch album art + album name from iTunes
        await Promise.allSettled(
            tracks.map(async t => {
                const info = await fetchITunesInfo(t.artist, t.name);
                t.albumArt = info.art;
                if (!t.album) t.album = info.album;
            }),
        );

        trackCache.set(cacheKey, { tracks, fetchedAt: Date.now() });
        return tracks;
    } catch (error) {
        logger.error("[SongSpotlight] Failed to fetch recent tracks:", error);
        throw error;
    }
}

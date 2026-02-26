import { logger } from "@lib/utils/logger";

import Constants from "../constants";
import { Track } from "../defs";
import { currentSettings } from "../storage";
import { BaseService } from "./BaseService";

interface ListenBrainzResponse {
  listens?: ListenBrainzListen[];
  error?: string;
}

interface ListenBrainzListen {
  listened_at: number;
  track_metadata: {
    artist_name: string;
    track_name: string;
    release_name?: string;
    additional_info?: {
      duration_ms?: number;
      artist_mbids?: string[];
      release_mbid?: string;
      recording_mbid?: string;
      spotify_id?: string;
      youtube_id?: string;
      isrc?: string;
      tags?: string[];
      media_player?: string;
      submission_client?: string;
      music_service?: string;
      origin_url?: string;
    };
  };
  playing_now?: boolean;
}

interface ListenBrainzPlayingNowResponse {
  listens: ListenBrainzListen[];
}

export class ListenBrainzService extends BaseService {
    getServiceName(): string {
        return "ListenBrainz";
    }

    protected logVerbose(...args: any[]): void {
        if (currentSettings.verboseLogging) {
            logger.verbose(`[${this.getServiceName()}] Verbose:`, ...args);
        }
    }

    async validateCredentials(): Promise<boolean> {
        try {
            const username = currentSettings.listenbrainzUsername;
            const token = currentSettings.listenbrainzToken;

            if (!username) {
                throw new Error("Username not set for ListenBrainz");
            }

            const url = `${Constants.SERVICES.listenbrainz.baseUrl}/user/${encodeURIComponent(username)}/listens?count=1`;

            const headers: Record<string, string> = {};
            if (token) {
                headers.Authorization = `Token ${token}`;
            }

            this.makeRequest(url, { headers });

            this.log("Credentials validation successful");
            return true;
        } catch (error) {
            this.logError("Credentials validation failed:", error);
            return false;
        }
    }

    async fetchLatestScrobble(): Promise<Track> {
        try {
            const username = currentSettings.listenbrainzUsername;
            const token = currentSettings.listenbrainzToken;

            if (!username) {
                throw new Error("Username not set for ListenBrainz");
            }

            this.logVerbose("Fetching latest scrobble for user:", username);

            let currentlyPlaying: ListenBrainzListen | null = null;

            // Helper to normalize ListenBrainz responses which may return either
            // { listens: [...] } or { payload: { listens: [...] } }
            const extractListens = (resp: any): ListenBrainzListen[] | undefined => {
                if (!resp) return undefined;
                if (Array.isArray(resp.listens)) return resp.listens;
                if (resp.payload && Array.isArray(resp.payload.listens))
                    return resp.payload.listens;
                if (resp.data && Array.isArray(resp.data.listens))
                    return resp.data.listens;
                return undefined;
            };

            try {
                const playingNowUrl = `${Constants.SERVICES.listenbrainz.baseUrl}/user/${encodeURIComponent(username)}/playing-now`;
                const headers: Record<string, string> = {};
                if (token) {
                    headers.Authorization = `Token ${token}`;
                }

                // Use a permissive any type for response, then normalize with extractListens
                const playingNowRaw: any = this.makeRequest(playingNowUrl, {
                    headers,
                });
                const playingNowListens = extractListens(playingNowRaw);
                if (playingNowListens && playingNowListens.length > 0) {
                    currentlyPlaying = playingNowListens[0];
                    currentlyPlaying.playing_now = true;
                }
            } catch (error) {
                this.logVerbose(
                    "No currently playing track or failed to fetch:",
                    error,
                );
            }

            let latestListen: ListenBrainzListen;

            if (currentlyPlaying) {
                latestListen = currentlyPlaying;
                this.logVerbose("Using currently playing track");
            } else {
                const url = `${Constants.SERVICES.listenbrainz.baseUrl}/user/${encodeURIComponent(username)}/listens?count=1`;
                const headers: Record<string, string> = {};
                if (token) {
                    headers.Authorization = `Token ${token}`;
                }

                const dataRaw: any = this.makeRequest(url, {
                    headers,
                });

                const recentListens = ((): ListenBrainzListen[] | undefined => {
                    if (!dataRaw) return undefined;
                    if (Array.isArray(dataRaw.listens)) return dataRaw.listens;
                    if (dataRaw.payload && Array.isArray(dataRaw.payload.listens))
                        return dataRaw.payload.listens;
                    if (dataRaw.data && Array.isArray(dataRaw.data.listens))
                        return dataRaw.data.listens;
                    return undefined;
                })();

                if (!recentListens || recentListens.length === 0) {
                    throw new Error("No listens found");
                }

                latestListen = recentListens[0];
                this.logVerbose("Using latest completed listen");
            }

            this.logVerbose("Raw listen data:", latestListen);

            const isNowPlaying = Boolean(latestListen.playing_now);
            const trackTimestamp =
        latestListen.listened_at || Math.floor(Date.now() / 1000);

            let duration: number | undefined = undefined;
            let endTime: number | null = null;

            if (latestListen.track_metadata.additional_info?.duration_ms) {
                duration = Math.floor(
                    latestListen.track_metadata.additional_info.duration_ms / 1000,
                );
                if (isNowPlaying && duration > 0) {
                    endTime = trackTimestamp + duration;
                }
            }

            // Try to get album art from MusicBrainz or other sources
            const albumArt: string | null = null;
            if (latestListen.track_metadata.additional_info?.release_mbid) {
                try {
                    // We could fetch cover art from Cover Art Archive, but for now we'll leave it null
                    // albumArt = `https://coverartarchive.org/release/${latestListen.track_metadata.additional_info.release_mbid}/front`;
                } catch (error) {
                    this.logVerbose("Failed to fetch album art:", error);
                }
            }

            const track: Track = {
                name: latestListen.track_metadata.track_name,
                artist: latestListen.track_metadata.artist_name,
                album: latestListen.track_metadata.release_name || "",
                albumArt,
                url:
          latestListen.track_metadata.additional_info?.origin_url ||
          `https://listenbrainz.org/user/${username}`,
                date: isNowPlaying
                    ? "now"
                    : new Date(trackTimestamp * 1000).toISOString(),
                nowPlaying: isNowPlaying,
                loved: false,
                from: trackTimestamp,
                to: endTime,
                duration,
            };

            this.logVerbose("Processed track:", track);
            this.log(
                `${isNowPlaying ? "Now playing" : "Last played"}:`,
                `${track.artist} - ${track.name}`,
            );

            return track;
        } catch (error) {
            this.logError("Failed to fetch latest listen:", error);
            throw error;
        }
    }

    protected getErrorMessage(error: any): string {
        if (error.error) {
            return error.error;
        }
        if (error.message) {
            return error.message;
        }
        return error.toString() || "Unknown error";
    }
}

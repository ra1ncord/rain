import { logger } from "@lib/utils/logger";

import Constants from "../constants";
import { Track } from "../defs";
import { currentSettings } from "../storage";
import { BaseService } from "./BaseService";

interface LastFMResponse {
  recenttracks?: {
    track: LastFMTrack[];
  };
  track?: {
    duration: string;
  };
  error?: number;
  message?: string;
}

interface LastFMTrack {
  name: string;
  artist: {
    name: string;
  };
  album: {
    "#text": string;
  };
  image?: {
    size: string;
    "#text": string;
  }[];
  url: string;
  date?: {
    "#text": string;
    uts: string;
  };
  "@attr"?: {
    nowplaying: boolean;
  };
  loved: string;
}

export class LastFmService extends BaseService {
    getServiceName(): string {
        return "Last.fm";
    }

    protected logVerbose(...args: any[]): void {
        if (currentSettings.verboseLogging) {
            logger.verbose(`[${this.getServiceName()}] Verbose:`, ...args);
        }
    }

    async validateCredentials(): Promise<boolean> {
        try {
            if (!currentSettings.username || !currentSettings.apiKey) {
                throw new Error("Username or API key not set");
            }

            const params = new URLSearchParams({
                method: "user.getinfo",
                user: currentSettings.username,
                api_key: currentSettings.apiKey,
                format: "json",
            });

            const url = `${Constants.SERVICES.lastfm.baseUrl}?${params}`;
            this.makeRequest(url);

            this.log("Credentials validation successful");
            return true;
        } catch (error) {
            this.logError("Credentials validation failed:", error);
            return false;
        }
    }

    async fetchLatestScrobble(): Promise<Track> {
        if (!currentSettings.username || !currentSettings.apiKey) {
            throw new Error("Username or API key not set");
        }

        this.logVerbose(
            "Fetching latest scrobble for user:",
            currentSettings.username,
        );

        const params = new URLSearchParams({
            method: "user.getrecenttracks",
            user: currentSettings.username,
            api_key: currentSettings.apiKey,
            limit: "1",
            extended: "1",
            format: "json",
        });

        const url = `${Constants.SERVICES.lastfm.baseUrl}?${params}`;

        return this.makeRequest(url)
            .then((data: LastFMResponse) => {
                const lastTrack = data?.recenttracks?.track?.[0];
                if (!lastTrack) {
                    throw new Error("No tracks found");
                }

                this.logVerbose("Raw track data:", lastTrack);

                const isNowPlaying = Boolean(lastTrack["@attr"]?.nowplaying);
                const trackTimestamp = lastTrack.date?.uts
                    ? parseInt(lastTrack.date.uts)
                    : Math.floor(Date.now() / 1000);

                let duration: number | undefined = undefined;
                let endTime: number | null = null;

                if (isNowPlaying) {
                    const trackInfoParams = new URLSearchParams({
                        method: "track.getInfo",
                        track: lastTrack.name,
                        artist: lastTrack.artist.name,
                        api_key: currentSettings.apiKey,
                        format: "json",
                    });

                    const trackInfoUrl = `${Constants.SERVICES.lastfm.baseUrl}?${trackInfoParams}`;

                    return this.makeRequest(trackInfoUrl)
                        .then((trackInfo: LastFMResponse) => {
                            if (trackInfo?.track?.duration) {
                                duration = parseInt(trackInfo.track.duration);
                                if (duration > 0) {
                                    duration = Math.floor(duration / 1000);
                                    endTime = trackTimestamp + duration;
                                }
                            }
                            return this.processTrack(lastTrack, isNowPlaying, trackTimestamp, duration, endTime);
                        })
                        .catch(() => {
                            return this.processTrack(lastTrack, isNowPlaying, trackTimestamp, duration, endTime);
                        });
                }

                return this.processTrack(lastTrack, isNowPlaying, trackTimestamp, duration, endTime);
            })
            .catch(error => {
                this.logError("Failed to fetch latest scrobble:", error);
                throw error;
            });
    }

    private processTrack(lastTrack: any, isNowPlaying: boolean, trackTimestamp: number, duration: number | undefined, endTime: number | null): Track {
        const albumArt = this.processAlbumArt(
            lastTrack.image?.find((img: any) => img.size === "large")?.["#text"],
        );

        const track: Track = {
            name: lastTrack.name,
            artist: lastTrack.artist.name,
            album: lastTrack.album["#text"],
            albumArt,
            url: lastTrack.url,
            date: lastTrack.date?.["#text"] ?? "now",
            nowPlaying: isNowPlaying,
            loved: lastTrack.loved === "1",
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
    }
}

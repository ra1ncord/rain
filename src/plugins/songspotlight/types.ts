export interface TopTrack {
    name: string;
    artist: string;
    album: string;
    playCount: number;
    url: string;
    albumArt: string | null;
    rank: number;
}

export interface LastFmTopTracksResponse {
    toptracks?: {
        track: LastFmTopTrack[];
        "@attr": {
            user: string;
            totalPages: string;
            page: string;
            perPage: string;
            total: string;
        };
    };
    error?: number;
    message?: string;
}

export interface LastFmTopTrack {
    name: string;
    duration: string;
    playcount: string;
    mbid: string;
    url: string;
    artist: {
        name: string;
        mbid: string;
        url: string;
    };
    image: {
        size: string;
        "#text": string;
    }[];
    "@attr": {
        rank: string;
    };
}

export type TimePeriod = "7day" | "1month" | "3month" | "6month" | "12month" | "overall";

export const PERIOD_LABELS: Record<TimePeriod, string> = {
    "7day": "Last 7 Days",
    "1month": "Last Month",
    "3month": "Last 3 Months",
    "6month": "Last 6 Months",
    "12month": "Last Year",
    "overall": "All Time",
};

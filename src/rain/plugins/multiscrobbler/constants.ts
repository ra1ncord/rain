import { ServiceConfig, ServiceType } from "./defs";
import { DEFAULT_SETTINGS } from "./storage";

const Constants = {
    DEFAULT_APP_NAME: "Music",
    DEFAULT_TIME_INTERVAL: 5,
    APPLICATION_ID: "1368513179272871956",
    MIN_UPDATE_INTERVAL: 3,
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 5000,

    SERVICES: {
        lastfm: {
            name: "Last.fm",
            baseUrl: "https://ws.audioscrobbler.com/2.0",
            requiresApiKey: true,
            requiresToken: false,
        },
        librefm: {
            name: "Libre.fm",
            baseUrl: "https://libre.fm/2.0",
            requiresApiKey: true,
            requiresToken: false,
        },
        listenbrainz: {
            name: "ListenBrainz",
            baseUrl: "https://api.listenbrainz.org/1",
            requiresApiKey: true,
            requiresToken: true,
        },
    } as Record<ServiceType, ServiceConfig>,

    // Default request headers. Avoid setting a custom User-Agent here to prevent exposing
    // environment or build details; the runtime should manage safe headers.
    DEFAULT_HEADERS: {} as Record<string, string>,

    // Last.fm/Libre.fm use these hashes for their generic album covers
    DEFAULT_COVER_HASHES: ["2a96cbd8b46e442fc41c2b86b821562f"],

    // Plugin defaults
    DEFAULT_SETTINGS,

    // Last.fm/Libre.fm API error codes
    API_ERROR_CODES: {
        2: "Invalid service",
        3: "Invalid method",
        4: "Invalid format",
        5: "Invalid parameters",
        6: "Invalid resource specified",
        7: "Invalid session key",
        8: "Invalid API key",
        9: "Invalid session",
        10: "Invalid API signature",
        11: "Service offline",
        13: "Invalid method signature supplied",
        16: "Service temporarily unavailable",
        26: "Suspended API key",
        29: "Rate limit exceeded",
    } as Record<number, string>,
} as const;

export default Constants;

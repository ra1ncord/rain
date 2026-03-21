import { createPluginStore } from "@api/storage";

import { Activity, ServiceType, Track } from "./defs";

export interface MultiScrobblerSettings {
    username: string;
    apiKey: string;
    appName: string;
    timeInterval: number;
    showTimestamp: boolean;
    listeningTo: boolean;
    showLargeText: boolean;
    ignoreYouTubeMusic: boolean;
    verboseLogging: boolean;
    service: ServiceType | undefined;
    librefmUsername: string;
    librefmApiKey: string;
    listenbrainzUsername: string;
    listenbrainzToken: string;
    showAlbumInTooltip: boolean;
    showDurationInTooltip: boolean;
    ignoreList: string[];
    lastTrackUrl: string | undefined;
}

export const DEFAULT_SETTINGS: MultiScrobblerSettings = {
    username: "",
    apiKey: "",
    appName: "Music",
    timeInterval: 5,
    showTimestamp: true,
    listeningTo: true,
    showLargeText: true,
    ignoreYouTubeMusic: false,
    verboseLogging: false,
    service: "lastfm" as ServiceType | undefined,
    librefmUsername: "",
    librefmApiKey: "",
    listenbrainzUsername: "",
    listenbrainzToken: "",
    showAlbumInTooltip: true,
    showDurationInTooltip: true,
    ignoreList: [],
    lastTrackUrl: undefined,
};

export const {
    useStore: useMultiScrobblerSettings,
    settings: multiScrobblerSettings,
} = createPluginStore<MultiScrobblerSettings>("multiscrobbler", DEFAULT_SETTINGS);

export const currentSettings = multiScrobblerSettings;

export const pluginState = {
    pluginStopped: false,
    lastActivity: undefined,
    updateInterval: undefined,
} as {
    pluginStopped: boolean;
    lastActivity?: any;
    updateInterval?: NodeJS.Timeout;
};

export const debugInfo = {
    lastActivity: undefined as Activity | undefined,
    lastTrack: undefined as Track | undefined,
    lastAPIResponse: undefined as any,
    ignoreList: undefined as boolean | undefined,
    componentMountErrors: [] as string[],
    lastReanimatedError: undefined as string | undefined,
    componentMountCount: 0,
    settingsLoadAttempts: 0,
    lastNavigationError: undefined as string | undefined,
    lastError: undefined as Error | undefined,
    lastUpdateError: undefined as any,
    lastTrack_nowPlaying: undefined as boolean | undefined,
    ignoredActivity: undefined as string | boolean | undefined,
    serviceErrors: { lastfm: [], librefm: [], listenbrainz: [] } as Record<ServiceType, string[]>,
    apiCallCount: 0,
    lastSuccessfulUpdate: undefined as string | undefined,
    currentService: undefined as ServiceType | undefined,
    connectionAttempts: 0,
    lastCredentialValidation: {
        lastfm: false,
        librefm: false,
        listenbrainz: false,
    } as Record<ServiceType, boolean>,
};

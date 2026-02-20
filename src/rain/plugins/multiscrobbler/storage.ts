import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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
    service: undefined as ServiceType | undefined,
    librefmUsername: "",
    librefmApiKey: "",
    listenbrainzUsername: "",
    listenbrainzToken: "",
    showAlbumInTooltip: true,
    showDurationInTooltip: true,
    ignoreList: [],
};

type MultiScrobblerStore = PluginStore<MultiScrobblerSettings>;

export const useMultiScrobblerSettings = create<MultiScrobblerStore>()(
    persist(
        (set) => ({
            ...DEFAULT_SETTINGS,
            _hasHydrated: false,
            updateSettings: (newSettings: Partial<MultiScrobblerSettings>) =>
                set((state) => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "multiscrobbler-settings",
            storage: createJSONStorage(() =>
                createFileStorage("plugins/multiscrobbler.json"),
            ),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        },
    ),
);

export const multiScrobblerSettings = new Proxy(
    {} as MultiScrobblerSettings,
    {
        get(_target, prop: string) {
            return useMultiScrobblerSettings.getState()[
                prop as keyof MultiScrobblerSettings
            ];
        },
        set(_target, prop: string, value: any) {
            useMultiScrobblerSettings
                .getState()
                .updateSettings({ [prop]: value } as Partial<MultiScrobblerSettings>);
            return true;
        },
    },
);

export const currentSettings = multiScrobblerSettings;

export const pluginState = {
    pluginStopped: false,
    lastActivity: undefined,
    updateInterval: undefined,
    lastTrackUrl: undefined,
} as {
    pluginStopped: boolean;
    lastActivity?: any;
    updateInterval?: NodeJS.Timeout;
    lastTrackUrl?: string;
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

import { createFileStorage, PluginStore } from "@api/storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface SongSpotlightSettings {
    /** Last.fm username */
    username: string;
    /** Last.fm API key */
    apiKey: string;
    /** Number of top tracks to display (1-10) */
    trackCount: number;
    /** Time period for top tracks */
    period: "7day" | "1month" | "3month" | "6month" | "12month" | "overall";
    /** Display mode: top tracks or recently played */
    displayMode: "top" | "recent";
    /** Show album art thumbnails */
    showAlbumArt: boolean;
    /** Show play count */
    showPlayCount: boolean;
    /** Show album name under the track */
    showAlbumName: boolean;
    /** Colorful cards — blurred album art background on each track row */
    colorfulCards: boolean;
    /** Show on own profile */
    showOnOwnProfile: boolean;
    /** Show on other users' profiles (via registry or bio detection) */
    showOnOtherProfiles: boolean;
    /** Show Last.fm header with avatar and username linking to profile */
    showLastFmHeader: boolean;
    /** Size of the Last.fm profile header: small, medium, or big */
    headerSize: "small" | "medium" | "big";
    /** Custom section title (empty = default "Song Spotlight") */
    sectionTitle: string;
    /** Show rank numbers on each track row */
    showRankNumbers: boolean;
    /** Card overlay opacity (0-100) for colorful cards */
    cardOpacity: number;
    /** Opt-in: share your Discord ID → Last.fm username to the public registry */
    shareUsername: boolean;
    /** URL of the song spotlight registry (Cloudflare Worker or compatible endpoint) */
    registryUrl: string;
}

export const DEFAULT_SETTINGS: SongSpotlightSettings = {
    username: "",
    apiKey: "",
    trackCount: 5,
    period: "7day",
    displayMode: "top",
    showAlbumArt: true,
    showPlayCount: true,
    showAlbumName: true,
    colorfulCards: true,
    showOnOwnProfile: true,
    showOnOtherProfiles: true,
    showLastFmHeader: true,
    headerSize: "small",
    sectionTitle: "",
    showRankNumbers: true,
    cardOpacity: 40,
    shareUsername: false,
    registryUrl: "https://songspotlight-registry.songspotlight.workers.dev",
};

type SongSpotlightStore = PluginStore<SongSpotlightSettings>;

export const useSongSpotlightSettings = create<SongSpotlightStore>()(
    persist(
        set => ({
            ...DEFAULT_SETTINGS,
            _hasHydrated: false,
            updateSettings: (newSettings: Partial<SongSpotlightSettings>) =>
                set(state => ({ ...state, ...newSettings })),
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: "songspotlight-settings",
            storage: createJSONStorage(() =>
                createFileStorage("plugins/songspotlight.json"),
            ),
            onRehydrateStorage: () => state => {
                state?.setHasHydrated(true);
            },
        },
    ),
);

export const songSpotlightSettings = new Proxy({} as SongSpotlightSettings, {
    get(_target, prop: string) {
        return useSongSpotlightSettings.getState()[prop as keyof SongSpotlightSettings];
    },
    set(_target, prop: string, value: any) {
        useSongSpotlightSettings.getState().updateSettings({ [prop]: value } as Partial<SongSpotlightSettings>);
        return true;
    },
});

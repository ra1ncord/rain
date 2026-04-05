import { createPluginStore } from "@api/storage";

export interface ActivityTimestamps {
    _enabled?: boolean;
    start?: number;
    end?: number;
}

export interface ActivityAssets {
    large_image?: string;
    large_text?: string;
    small_image?: string;
    small_text?: string;
}

export interface ActivityButton {
    label?: string;
    url?: string;
}

export interface Activity {
    name: string;
    application_id: string;
    flags: number;
    type: number;
    details?: string;
    state?: string;
    timestamps?: ActivityTimestamps;
    assets?: ActivityAssets;
    buttons?: ActivityButton[];
    metadata?: { button_urls?: string[] };
}

export interface RichPresenceSettings {
    selectedProfile: string;
    profiles: Record<string, Activity>;
}

export const DEFAULT_APP_ID = "1054951789318909972";

const defaultActivity: Activity = {
    name: "Discord",
    application_id: DEFAULT_APP_ID,
    flags: 0,
    type: 0,
    timestamps: {
        _enabled: false,
        start: Date.now(),
    },
    assets: {},
    buttons: [],
};

export const {
    useStore: useRichPresenceSettings,
    settings: richPresenceSettings,
} = createPluginStore<RichPresenceSettings>("richpresence", {
    selectedProfile: "default",
    profiles: { default: defaultActivity },
});

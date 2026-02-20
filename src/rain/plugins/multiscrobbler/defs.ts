export type Activity = {
  name: string;
  application_id: string;
  flags: number;
  type: number;
  details?: string;
  state?: string;
  timestamps?: {
    _enabled?: boolean;
    start: number | string;
    end?: number | string;
  };
  assets?: ActivityAssets;
  buttons?: ActivityButton[];
  status_display_type?: number;
};

export type ActivityButton = {
  label: string;
  url: string;
};

export type ActivityAssets = {
  large_image?: string;
  large_text?: string;
  small_image?: string;
  small_text?: string;
};

export type ServiceType = "lastfm" | "librefm" | "listenbrainz";

export type LFMSettings = {
  // Service-specific settings
  librefmUsername?: string;
  librefmApiKey?: string;
  listenbrainzUsername?: string;
  listenbrainzToken?: string;
  appName: string;
  username: string;
  apiKey: string;
  // Display settings
  showTimestamp: boolean;
  timeInterval: number | string;
  listeningTo: boolean;
  showLargeText: boolean;
  ignoreYouTubeMusic: boolean;
  // Verbose logging settings
  verboseLogging: boolean;
  // Main page
  service: ServiceType | undefined;
};

export type Track = {
  name: string;
  artist: string;
  album: string;
  albumArt: string | null;
  url: string;
  date: string;
  nowPlaying: boolean;
  loved: boolean;
  from: number;
  to: number | null;
  duration?: number;
};

export interface ServiceClient {
  fetchLatestScrobble(): Promise<Track>;
  validateCredentials(): Promise<boolean>;
  getServiceName(): string;
}

export interface ServiceConfig {
  name: string;
  baseUrl: string;
  requiresApiKey: boolean;
  requiresToken: boolean;
}

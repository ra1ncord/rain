import { cloudSyncSettings } from "./storage";

export const defaultHost = "https://cloud.raincord.dev/";
export const defaultClientId = "1477357340045873204";

export const getApiUrl = () => {
    const host = cloudSyncSettings.customHost || defaultHost;
    return host.endsWith("/") ? host : `${host}/`;
};

export const getClientId = () => {
    return cloudSyncSettings.customClientId || defaultClientId;
};

export const getRedirectUrl = () => {
    return `${getApiUrl()}api/auth/authorize`;
};

import { cloudSyncSettings } from "./storage";

export const defaultHost = "https://dc.cloudsync.nexpid.xyz/";
export const defaultClientId = "1120793656878714913";

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

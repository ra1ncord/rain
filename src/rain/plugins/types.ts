export interface rainPlugin {
    name: string;
    description: string;
    id: string;
    icon: string;
    version: string;
    author: developer[];
    islazy: boolean;
    start: () => void;
    stop?: () => void;
}

export interface PluginSettingsStorage {
    [pluginId: string]: {
        enabled: boolean;
    };
}

export interface developer {
    name: string;
    id: bigint;
}
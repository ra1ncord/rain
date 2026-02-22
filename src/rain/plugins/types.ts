import { JSX } from "react";

export interface rainPlugin {
    name: string;
    description: string;
    id: string;
    version: string;
    author: developer[];
    start?: () => void;
    eagerStart?: () => void;
    stop?: () => void;
    settings?(): JSX.Element;
    devOnly?: boolean;
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

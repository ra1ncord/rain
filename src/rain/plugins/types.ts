import { JSX } from "react";

export interface rainPlugin {
    name: string;
    description: string;
    id: string;
    version: string;
    author: developer[];
    platforms?: ["android" | "ios"];
    start?: () => void;
    eagerStart?: () => void;
    stop?: () => void;
    settings?(): JSX.Element;
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

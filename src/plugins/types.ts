import { JSX } from "react";

export interface rainPlugin {
    name: string;
    description: string;
    id: string;
    version: string;
    author: developer[];
    platforms?: ["android" | "ios"];
    predicates?: (() => boolean)[];
    requiresRestart?: boolean;
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

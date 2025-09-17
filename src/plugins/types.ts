export interface Developer {
    readonly name: string;
    readonly id: bigint;
}

export interface PluginDef {
    readonly name: string;
    readonly description: string;
    readonly id: string;
    readonly version: string;
    readonly authors: Developer;
}

export interface PluginInstance {
    start?(): void;
    stop?(): void;
}

export interface PluginInstanceInternal extends PluginInstance {
    readonly manifest: Manifest;
}

export interface Manifest {
    readonly id: string;
    readonly version: string;
    readonly display: {
        readonly name: string;
        readonly description?: string;
        readonly authors?: Developer[];
    };
    readonly extras?: {
        readonly [key: string]: any;
    };
}

export interface plugin {
    default: PluginInstanceInternal;
    preenabled: boolean;
}
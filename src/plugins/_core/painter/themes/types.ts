interface SemanticReference {
    type: "color" | "raw";
    value: string;
    opacity?: number;
}

interface BackgroundDefinition {
    url: string;
    blur?: number;
    opacity?: number;
}

export interface RainColorManifest extends RainManifest {
    type: "color";
    spec: 3;
    main: {
        type: "dark" | "light";
        semantic?: Record<string, string | SemanticReference>;
        raw?: Record<string, string>;
        background?: BackgroundDefinition;
    }
}

export interface ThemeManifest {
    spec: 2 | 3;
    name: string;
    description?: string;
    authors?: Author[];
    semanticColors?: Record<string, (string | false)[]>;
    rawColors?: Record<string, string>;
    background?: {
        url: string;
        blur?: number;
        alpha?: number;
    };
    display: {
        name: string;
        description: string;
        authors: Author[];
    }
}

/** @internal */
export interface InternalColorDefinition {
    spec: 1 | 2 | 3;
    reference: "darker" | "light";
    semantic: Record<string, {
        value: string;
        opacity: number;
    }>;
    raw: Record<string, string>;
    background?: BackgroundDefinition;
    display?: {
        name: string;
        description?: string;
        authors?: Author[];
    };
}

export type ColorManifest = RainColorManifest | ThemeManifest;

export type Author = { name: string, id?: `${bigint}`; };

export interface RainManifest {
    readonly id: string;
    readonly spec: number;
    readonly version: string;
    readonly type: string;
    readonly display: {
        readonly name: string;
        readonly description?: string;
        readonly authors?: Author[];
    };
    readonly main: unknown;
    readonly extras?: {
        readonly [key: string]: any;
    };
}

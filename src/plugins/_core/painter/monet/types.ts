export type Patches = PatchV2 | PatchV3;

export interface PatchV2 {
    version: 2;
    replacers: PatchThing<[string, number]>;
    semantic: PatchThing<string>;
    raw: PatchThing<string>;
}

export interface PatchV3 {
    version: 3;
    replacers: PatchThing<{
        color: string;
        ratio?: number;
        base?: number;
        alternative?: boolean;
    }>;
    semantic: PatchThing<string>;
    raw: PatchThing<string>;
    plus: {
        unreadBadgeColor: PatchThingSingle<string>;
        mentionLineColor: PatchThingSingle<string>;
        icons: PatchThing<string>;
    };
}

export interface PatchThing<value> {
    dark: Record<string, value>;
    light: Record<string, value>;
    both: Record<string, value>;
}

export type PatchThingSingle<value> =
    | { dark: value; light: value }
    | { both: value };

export interface VendettaSysColors {
    neutral1: string[];
    neutral2: string[];
    accent1: string[];
    accent2: string[];
    accent3: string[];
}

export interface MonetColors {
    neutral1: string;
    neutral2: string;
    accent1: string;
    accent2: string;
    accent3: string;
}

export interface MonetConfig {
    wallpaper: string | "none";
    custom: { title: string; url: string }[];
}

export interface MonetCache {
    colors?: string;
    theme?: string;
}

export interface MonetPatchConfig {
    from: "git" | "local";
    commit?: string;
}

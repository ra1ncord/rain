export interface ThemesPlusMeta {
    version?: number;
    iconpack?: string;
    customOverlays?: boolean;
    icons?: Record<string, string>;
}

export interface ThemesPlusState {
    activeIconpack?: string | null;
    lastAppliedTheme?: string | null;
    plus?: ThemesPlusMeta | null;
}

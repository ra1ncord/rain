import { developer } from "@plugins/types";

export interface UnifiedPluginModel {
    id: string;
    name: string;
    description?: string;
    developers?: developer[];
    contributors?: developer[];
    requiresRestart?: boolean;
    devOnly?: boolean;
    isEnabled(): boolean;
    isCore(): boolean;
    isPlatformSupported?(): boolean;
    arePredicatesMet?(): boolean;
    usePluginState?(): void;
    isInstalled?(): boolean;
    toggle(start: boolean): void;
    resolveSheetComponent(): Promise<{ default: React.ComponentType<any>; }>;
    getPluginSettingsComponent?(): React.ComponentType<any> | null | undefined;
}

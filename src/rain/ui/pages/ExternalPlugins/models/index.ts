import { Author } from "@rain/plugins/traveller/types";
import { ImageSourcePropType } from "react-native";

interface Badge {
    source: ImageSourcePropType;
    color?: string;
    onPress?: () => void;
}

export interface UnifiedPluginModel {
    id: string;
    name: string;
    description?: string;
    authors?: Author[];
    icon?: string;
    isEnabled(): boolean;
    usePluginState(): void;
    isInstalled(): boolean;
    toggle(start: boolean): void;
    resolveSheetComponent(): Promise<{ default: React.ComponentType<any>; }>;
    getPluginSettingsComponent(): React.ComponentType<any> | null | undefined;
}

import { useSettings } from "@api/settings";
import { showSheet } from "@api/ui/sheets";
import { FluxDispatcher, navigation } from "@metro/common";
import { ThemeInfo,useThemes } from "@plugins/_core/painter/themes";
import { ColorManifest, RainColorManifest, ThemeManifest } from "@plugins/_core/painter/themes/types";
import AddonCard, { CardWrapper, CompactCardWrapper } from "@rain/pages/Addon/AddonCard";
import * as React from "react";

function selectAndApply(value: boolean, theme: ThemeInfo) {
    try {
        useThemes.getState().selectTheme(value ? theme.id : null);
    } catch (e: any) {
        console.error("Error while selectAndApply,", e);
    }
}

export default function ThemeCard({ item: theme, compact }: CardWrapper<ThemeInfo> | CompactCardWrapper<ThemeInfo>) {
    const isSelected = useThemes(
        React.useCallback(
            state => state.themes[theme.id]?.selected ?? false,
            [theme.id]
        )
    );

    const safeModeEnabled = useSettings(state => state.safeMode);
    const { fetchTheme, removeTheme } = useThemes.getState();
    const [removed, setRemoved] = React.useState(false);

    if (removed) return null;

    const manifest = theme.data as ColorManifest;
    const isSpec3 = manifest.spec === 3;
    const display = isSpec3 ? (manifest as RainColorManifest).display : (manifest as ThemeManifest);
    const authors = display?.authors;
    const name = display?.name;
    const description = display?.description;

    return (
        <AddonCard
            compact={compact}
            headerLabel={name}
            headerSublabel={authors ? `by ${authors.map((i: any) => i.name).join(", ")}` : ""}
            headerLabelVariant="heading-lg/semibold"
            headerSublabelVariant="text-sm/semibold"
            descriptionLabel={description}
            toggleType={!safeModeEnabled ? "radio" : undefined}
            toggleValue={() => isSelected}
            onToggleChange={(v: boolean) => {
                // todo: move this out of ui
                FluxDispatcher.dispatch({ type: "RAIN_SETTING_UPDATED" });
                selectAndApply(v, theme);
            }}
            overflowTitle={name}
            actions={[
                {
                    icon: "CircleInformationIcon-primary",
                    onPress: () => {
                        const importPromise = import("./sheets/ThemeInfoActionSheet");
                        showSheet("ThemeInfoActionSheet", importPromise, {
                            theme,
                            navigation,
                        });
                    },
                },
            ]}
        />
    );
}

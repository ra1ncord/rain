import { useSettings } from "@api/settings";
import { showSheet } from "@api/ui/sheets";
import { navigation } from "@metro/common";
import { applyMonetTheme } from "@plugins/_core/painter/monet";
import { ThemeInfo,useThemes } from "@plugins/_core/painter/themes";
import AddonCard, { CardWrapper } from "@rain/pages/Addon/AddonCard";
import * as React from "react";

async function selectAndApply(value: boolean, theme: ThemeInfo) {
    try {
        if (value) {
            applyMonetTheme(null);
        }
        await useThemes.getState().selectTheme(value ? theme.id : null);
    } catch (e: any) {
        console.error("Error while selectAndApply,", e);
    }
}

export default function ThemeCard({ item: theme }: CardWrapper<ThemeInfo>) {
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

    const { authors } = theme.data;

    return (
        <AddonCard
            headerLabel={theme.data.name}
            headerSublabel={authors ? `by ${authors.map(i => i.name).join(", ")}` : ""}
            headerLabelVariant="heading-lg/semibold"
            headerSublabelVariant="text-sm/semibold"
            descriptionLabel={theme.data.description ?? "No description."}
            toggleType={!safeModeEnabled ? "radio" : undefined}
            toggleValue={() => isSelected}
            onToggleChange={(v: boolean) => {
                selectAndApply(v, theme);
            }}
            overflowTitle={theme.data.name}
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

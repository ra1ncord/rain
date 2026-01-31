import { findAssetId } from "@api/assets";
import { useSettings } from "@api/settings";
import { showConfirmationAlert } from "@api/ui/alerts";
import { showToast } from "@api/ui/toasts";
import { clipboard } from "@metro/common";
import { useThemes, VdThemeInfo } from "@plugins/_core/painter/themes";
import AddonCard, { CardWrapper } from "@rain/pages/Addon/AddonCard";
import * as React from "react";

async function selectAndApply(value: boolean, theme: VdThemeInfo) {
    try {
        await useThemes.getState().selectTheme(value ? theme.id : null);
    } catch (e: any) {
        console.error("Error while selectAndApply,", e);
    }
}

export default function ThemeCard({ item: theme }: CardWrapper<VdThemeInfo>) {
    const isSelected = useThemes(
        React.useCallback(
            state => state.themes[theme.id]?.selected ?? false,
            [theme.id]
        )
    );

    const safeModeEnabled = useSettings(state => state.safeMode?.enabled);
    const { fetchTheme, removeTheme } = useThemes.getState();
    const [removed, setRemoved] = React.useState(false);

    if (removed) return null;

    const { authors } = theme.data;

    return (
        <AddonCard
            headerLabel={theme.data.name}
            headerSublabel={authors ? `by ${authors.map(i => i.name).join(", ")}` : ""}
            descriptionLabel={theme.data.description ?? "No description."}
            toggleType={!safeModeEnabled ? "radio" : undefined}
            toggleValue={() => isSelected}
            onToggleChange={(v: boolean) => {
                selectAndApply(v, theme);
            }}
            overflowTitle={theme.data.name}
            overflowActions={[
                {
                    icon: "ic_sync_24px",
                    label: "Refetch",
                    onPress: () => {
                        fetchTheme(theme.id, isSelected).then(() => {
                            showToast("Theme refetched successfully", findAssetId("toast_image_saved"));
                        }).catch(() => {
                            showToast("Failed to refetch theme", findAssetId("Small"));
                        });
                    },
                },
                {
                    icon: "copy",
                    label: "Copy URL",
                    onPress: () => {
                        clipboard.setString(theme.id);
                        showToast.showCopyToClipboard();
                    }
                },
                {
                    icon: "ic_message_delete",
                    label: "Delete",
                    isDestructive: true,
                    onPress: () => showConfirmationAlert({
                        title: "Hold up",
                        content: `Are you sure you want to delete ${theme.data.name}?`,
                        confirmText: "Delete",
                        cancelText: "Cancel",
                        confirmColor: "red",
                        onConfirm: () => {
                            removeTheme(theme.id).then(wasSelected => {
                                setRemoved(true);
                            }).catch((e: Error) => {
                                showToast(e.message, findAssetId("Small"));
                            });
                        }
                    })
                },
            ]}
        />
    );
}

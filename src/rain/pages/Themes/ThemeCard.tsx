import AddonCard, { CardWrapper } from "@rain/pages/Addon/AddonCard";
import { showConfirmationAlert } from "@api/ui/alerts";
import { useObservable } from "@api/storage";
import { fetchTheme, removeTheme, selectTheme, themes, VdThemeInfo } from "@plugins/_core/painter/themes";
import { findAssetId } from "@api/assets";
import { settings } from "@api/settings";
import { clipboard } from "@metro/common";
import { showToast } from "@api/ui/toasts";
import * as React from "react";

async function selectAndApply(value: boolean, theme: VdThemeInfo) {
    try {
        await selectTheme(value ? theme : null);
    } catch (e: any) {
        console.error("Error while selectAndApply,", e);
    }
}

export default function ThemeCard({ item: theme }: CardWrapper<VdThemeInfo>) {
    useObservable([theme]);
    
    const [removed, setRemoved] = React.useState(false);
    
    // This is needed because of React™
    if (removed) return null;
    
    const { authors } = theme.data;
    
    return (
        <AddonCard
            headerLabel={theme.data.name}
            headerSublabel={authors ? `by ${authors.map(i => i.name).join(", ")}` : ""}
            descriptionLabel={theme.data.description ?? "No description."}
            toggleType={!settings.safeMode?.enabled ? "radio" : undefined}
            toggleValue={() => themes[theme.id].selected}
            onToggleChange={(v: boolean) => {
                selectAndApply(v, theme);
            }}
            overflowTitle={theme.data.name}
            overflowActions={[
                {
                    icon: "ic_sync_24px",
                    label: "Refetch",
                    onPress: () => {
                        fetchTheme(theme.id, theme.selected).then(() => {
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
                                if (wasSelected) selectAndApply(false, theme);
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
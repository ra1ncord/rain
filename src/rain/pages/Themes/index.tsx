import React, { useEffect, useMemo, useReducer, useState } from "react";
import AddonPage from "@rain/pages/Addon/AddonPage";
import { Card } from "@metro/common/components";
import { Button, IconButton, Stack, Text, TextInput } from "@metro/common/components";
import { View } from "react-native"
import { themes as kThemes, selectTheme, removeTheme, installTheme, getStoredTheme } from "@plugins/_core/painter/themes";
import { CardWrapper } from "@rain/pages/Addon/AddonCard";
import { findAssetId } from "@api/assets";
import { showConfirmationAlert } from "@api/ui/alerts";
import { BundleUpdaterManager } from "@api/native/modules";
import { logger } from "@lib/utils/logger";
import { lazyDestructure } from "@lib/utils/lazy";
import { findByProps } from "@metro/wrappers";
import { clipboard } from "@metro/common";

const { showSimpleActionSheet, hideActionSheet } = lazyDestructure(() => findByProps("showSimpleActionSheet"));
const { showToast } = lazyDestructure(() => findByProps("showToast"));

type ThemeListItem = { id: string; name: string; author?: string; builtin?: boolean; selected?: boolean };

function ThemeCard({ item: theme, onChange }: CardWrapper<ThemeListItem> & { onChange?: () => void }) {
    const active = !!theme.selected;
    const isBuiltin = !!theme.builtin;
    const author = theme.author ?? "Unknown";

    const handleRefetch = async () => {
        try {
            hideActionSheet();
            showToast("Refetching theme...");
            await installTheme(theme.id);
            onChange?.();
            showConfirmationAlert({
                title: "Theme refetched",
                content: "Reload Discord to see changes.",
                confirmText: "Reload",
                cancelText: "Later",
                confirmColor: "red",
                onConfirm: BundleUpdaterManager.reload,
            });
        } catch (e) {
            logger.error("[Themer] Failed to refetch theme", e);
            showToast("Failed to refetch theme");
        }
    };

    const handleDelete = () => {
        hideActionSheet();
        showConfirmationAlert({
            title: "Delete Theme",
            content: `Are you sure you want to delete ${theme.name}?`,
            confirmText: "Delete",
            cancelText: "Cancel",
            confirmColor: "red",
            onConfirm: () => {
                removeTheme(theme.id);
                onChange?.();
            },
        });
    };

    const handleCopyUrl = () => {
        clipboard.setString(theme.id);
        hideActionSheet();
        showToast("Theme URL copied to clipboard");
    };

    return (
        <Card>
            <Stack spacing={16}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View>
                        <Text variant="heading-lg/semibold">{theme.name}</Text>
                        <Text color="text-muted" variant="text-sm/semibold">
                            by {author}{isBuiltin ? " • Built-in" : ""}
                        </Text>
                    </View>
                    <View style={{ marginLeft: "auto" }}>
                        <Stack spacing={12} direction="horizontal">
                            {!isBuiltin && (
                                <IconButton
                                    onPress={() => showSimpleActionSheet({
                                        key: "ThemeInfo",
                                        header: {
                                            title: theme.name,
                                            onClose: () => hideActionSheet(),
                                        },
                                        options: [
                                            {
                                                label: "Refetch",
                                                icon: findAssetId("RetryIcon"),
                                                onPress: handleRefetch,
                                            },
                                            {
                                                label: "Copy URL",
                                                icon: findAssetId("CopyIcon"),
                                                onPress: handleCopyUrl,
                                            },
                                            {
                                                label: "Delete",
                                                icon: findAssetId("TrashIcon"),
                                                isDestructive: true,
                                                onPress: handleDelete,
                                            },
                                        ],
                                    })}
                                    size="sm"
                                    variant="secondary"
                                    icon={findAssetId("CircleInformationIcon-primary")}
                                />
                            )}
                            <Button
                                size="sm"
                                variant={active ? "secondary" : "primary"}
                                text={active ? "Unapply" : "Apply"}
                                onPress={async () => {
                                    if (active) {
                                        await selectTheme(null);
                                    } else {
                                        const kettuTheme = (kThemes as any)[theme.id];
                                        if (kettuTheme) await selectTheme(kettuTheme);
                                    }
                                    onChange?.();
                                    showConfirmationAlert({
                                        title: "Reload to apply?",
                                        content: "Reload Discord to apply theme changes.",
                                        confirmText: "Reload",
                                        cancelText: "Cancel",
                                        confirmColor: "red",
                                        onConfirm: BundleUpdaterManager.reload,
                                    });
                                }}
                            />
                        </Stack>
                    </View>
                </View>
            </Stack>
        </Card>
    );
}

export function ThemerSettings() {
    const [themes, setThemes] = useState<ThemeListItem[]>([]);
    const [url, setUrl] = useState("");
    const [, forceRefresh] = useReducer(x => x + 1, 0);

    const displayNameFromUrl = (u: string) => {
        try {
            const url = new URL(u);
            const parts = url.pathname.split("/").filter(Boolean);
            const last = parts[parts.length - 1] || u;
            return last.replace(/\.json$/i, "");
        } catch {
            const parts = u.split("/").filter(Boolean);
            const last = parts[parts.length - 1] || u;
            return last.replace(/\.json$/i, "");
        }
    };

    const refresh = async () => {
        await import("@api/storage").then(m => m.awaitStorage(kThemes));
        
        const installed = Object.values(kThemes as any) as Array<{ id: string; selected: boolean; data: any }>;
        const activeStoredTheme = getStoredTheme();
        
        const list: ThemeListItem[] = installed.map(t => {
            const isBuiltin = t.id.startsWith("builtin:");
            const name = isBuiltin ? t.id.replace("builtin:", "") : displayNameFromUrl(t.id);
            
            let author = "Unknown";
            if (isBuiltin) {
                author = "LampDelivery";
            } else {
                const authorsArray = t.data?.plus?.authors || t.data?.manifest?.authors;
                if (authorsArray && Array.isArray(authorsArray) && authorsArray.length > 0) {
                    author = authorsArray[0]?.name || authorsArray[0];
                } else if (t.data?.plus?.author) {
                    author = t.data.plus.author;
                } else if (t.data?.manifest?.author) {
                    author = t.data.manifest.author;
                } else {
                    try {
                        const url = new URL(t.id);
                        if (url.hostname.includes("github")) {
                            const parts = url.pathname.split("/").filter(Boolean);
                            if (parts.length > 0) author = parts[0]; 
                        }
                    } catch {}
                }
            }
            
            return {
                id: t.id,
                name,
                author,
                builtin: isBuiltin,
                selected: activeStoredTheme?.id === t.id,
            };
        });
        
        setThemes(list);
        forceRefresh();
    };

    useEffect(() => {
        refresh();
    }, []);

    useEffect(() => {
        const refreshInterval = setInterval(() => refresh(), 500);
        return () => clearInterval(refreshInterval);
    }, []);

    const searchKeywords = useMemo(() => [
        "name",
        (t: ThemeListItem) => t.author ?? "",
    ], []);

    const ThemeCardWithRefresh = (props: CardWrapper<ThemeListItem>) => <ThemeCard {...props} onChange={refresh} />;

    return (
        <AddonPage<ThemeListItem>
            title={"Themes"}
            items={themes}
            searchKeywords={searchKeywords}
            CardComponent={ThemeCardWithRefresh}
            installAction={{
                label: "Install Theme",
                fetchFn: async (u: string) => {
                    await installTheme(u);
                    refresh();
                },
            }}
        />
    );
}

export default ThemerSettings;

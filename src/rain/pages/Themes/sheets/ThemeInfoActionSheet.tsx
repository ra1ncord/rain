import { findAssetId } from "@api/assets";
import { showConfirmationAlert } from "@api/ui/alerts";
import { semanticColors } from "@api/ui/components/color";
import { hideSheet } from "@api/ui/sheets";
import { showToast } from "@api/ui/toasts";
import { formatString, Strings } from "@i18n";
import { lazyDestructure } from "@lib/utils/lazy";
import { findByNameLazy, findByProps } from "@metro";
import { clipboard, FluxUtils } from "@metro/common";
import { ActionSheet, Avatar, Card, IconButton, Text } from "@metro/common/components";
import { UserStore } from "@metro/common/stores";
import { fetchTheme, removeTheme, selectTheme, ThemeInfo } from "@plugins/_core/painter/themes";
import { ColorManifest, RainColorManifest, ThemeManifest } from "@plugins/_core/painter/themes/types";
import React, { ComponentProps, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";

const showUserProfileActionSheet = findByNameLazy("showUserProfileActionSheet");
const { getUser: maybeFetchUser } = lazyDestructure(() => findByProps("getUser", "fetchProfile"));

interface ThemeInfoActionSheetProps {
    theme: ThemeInfo;
    navigation: any;
}

function ThemeInfoIconButton(props: ComponentProps<typeof IconButton>) {
    const { onPress } = props;
    props.onPress &&= () => {
        hideSheet("ThemeInfoActionSheet");
        onPress?.();
    };

    return <IconButton {...props} label={props.label} />;
}

function AuthorCard({ title, authors }: { title: string; authors: { name: string; id: bigint }[] }) {
    if (!authors?.length) return null;

    const users: any[] = FluxUtils.useStateFromStoresArray([UserStore], () => {
        authors.forEach(a => a.id && maybeFetchUser(a.id));
        return authors.map(a => UserStore.getUser(a.id));
    });

    return (
        <Card>
            <Text
                variant="text-md/semibold"
                style={{
                    marginBottom: 8,
                    color: semanticColors.MOBILE_TEXT_HEADING_PRIMARY,
                }}
            >
                {title}
            </Text>
            <View style={{ gap: 3 }}>
                {authors.map((author, index) => (
                    <View
                        key={index}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            backgroundColor: semanticColors.BACKGROUND_TERTIARY,
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 8,
                        }}
                    >
                        <Avatar
                            size="small"
                            user={users[index]}
                        />
                        <Text
                            variant="text-md/medium"
                            onPress={() => showUserProfileActionSheet({ userId: author.id })}
                        >
                            {author.name}
                        </Text>
                    </View>
                ))}
            </View>
        </Card>
    );
}

function TitleComponent({ theme }: { theme: ThemeInfo }) {
    const manifest = theme.data as ColorManifest;
    const isSpec3 = manifest.spec === 3;
    const display = isSpec3 ? (manifest as RainColorManifest).display : (manifest as ThemeManifest);
    const name = display?.name;

    return (
        <View style={{ gap: 4 }}>
            <Text variant="heading-xl/semibold">{name}</Text>
        </View>
    );
}

export default function ThemeInfoActionSheet({
    theme,
    navigation,
}: ThemeInfoActionSheetProps) {
    // use component state to track theme data
    const [themeState, setThemeState] = useState({ ...theme });
    const [loading, setLoading] = useState(false);

    // periodic refresh to detect external changes to theme state
    useEffect(() => {
        const interval = setInterval(() => {
            setThemeState({ ...theme });
        }, 500);

        return () => clearInterval(interval);
    }, [theme]);

    const copyThemeUrl = () => {
    // Copy theme ID as URL
        clipboard.setString(themeState.id);
        if (typeof showToast?.showCopyToClipboard === "function") {
            showToast.showCopyToClipboard();
        } else {
            showToast(Strings.COPIED_TO_CLIPBOARD);
        }
    };

    const refetchTheme = async () => {
        setLoading(true);
        try {
            await fetchTheme(themeState.id, themeState.selected);
            showToast(Strings.THEME_REFRESHED);
        } catch (e) {
            console.error("Failed to refresh theme:", e);
            showToast(Strings.FAILED_TO_REFRESH_THEME);
        } finally {
            setLoading(false);
        }
    };

    const removeThemeHandler = () => {
        showConfirmationAlert({
            title: Strings.HOLD_UP,
            content: formatString("ARE_YOU_SURE_TO_DELETE_THEME", {
                name: themeState.data.name,
            }),
            confirmText: Strings.DELETE,
            cancelText: Strings.CANCEL,
            confirmColor: "red",
            onConfirm: async () => {
                hideSheet("ThemeInfoActionSheet");
                try {
                    const wasSelected = await removeTheme(themeState.id);
                    if (wasSelected) selectTheme(null);
                    showToast(Strings.THEME_REMOVED);
                } catch (e) {
                    console.error("Failed to remove theme:", e);
                    showToast(Strings.FAILED_TO_REMOVE_THEME);
                }
            },
        });
    };

    const manifest = themeState.data as ColorManifest;
    const isSpec3 = manifest.spec === 3;
    const display = isSpec3 ? (manifest as RainColorManifest).display : (manifest as ThemeManifest);
    const description = display?.description;
    const authors = display?.authors || themeState.data.authors;

    return (
        <ActionSheet>
            <ScrollView contentContainerStyle={{ gap: 12, marginBottom: 12, paddingTop: 16 }}>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        gap: 8,
                        justifyContent: "space-between",
                        width: "100%",
                    }}
                >
                    <TitleComponent theme={themeState} />
                </View>

                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 30,
                        paddingHorizontal: 8,
                    }}
                >
                    <ThemeInfoIconButton
                        label={Strings.REFETCH}
                        variant="secondary"
                        icon={findAssetId("RetryIcon")}
                        onPress={refetchTheme}
                        disabled={loading}
                    />
                    <ThemeInfoIconButton
                        label={Strings.COPY_URL}
                        variant="secondary"
                        icon={findAssetId("LinkIcon")}
                        onPress={copyThemeUrl}
                    />
                    <ThemeInfoIconButton
                        label={Strings.UNINSTALL}
                        variant="secondary"
                        icon={findAssetId("TrashIcon")}
                        onPress={removeThemeHandler}
                    />
                </View>

                <Card>
                    <Text
                        variant="text-md/semibold"
                        style={{
                            marginBottom: 4,
                            color: semanticColors.MOBILE_TEXT_HEADING_PRIMARY,
                        }}
                    >
                        {Strings.DESCRIPTION}
                    </Text>
                    <Text variant="text-md/medium">
                        {description}
                    </Text>
                </Card>

                {authors?.length ? (
                    <AuthorCard title="Themers" authors={authors} />
                ) : null}
            </ScrollView>
        </ActionSheet>
    );
}

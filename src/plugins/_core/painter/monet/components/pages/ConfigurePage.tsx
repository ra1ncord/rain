import { findAssetId } from "@api/assets";
import { showSheet } from "@api/ui/sheets";
import { showToast } from "@api/ui/toasts";
import { createStyles } from "@api/ui/styles";
import { semanticColors } from "@api/ui/components/color";
import { React, ReactNative as RN } from "@metro/common";
import { PressableScale, Text } from "@metro/common/components";

import { useMonetSettings } from "../../storage";
import { getDiscordTheme } from "../../stuff/buildTheme";
import wallpapers, { type Collection, type CollectionEntry } from "../../stuff/wallpapers";
import AddBackgroundSheet, { SHEET_KEY } from "../sheets/AddBackgroundSheet";

import type { ImageSourcePropType } from "react-native";

const useStyles = createStyles({
    thing: {
        backgroundColor: semanticColors.BACKGROUND_MOD_MUTED,
        borderRadius: 8,
        marginRight: 8,
    },
    centerThing: {
        alignItems: "center" as const,
        justifyContent: "center" as const,
    },
    selectedThing: {
        borderWidth: 2,
        borderColor: semanticColors.TEXT_BRAND,
    },
    centerImage: {
        width: 24,
        height: 24,
        tintColor: semanticColors.INTERACTIVE_ICON_DEFAULT,
    },
});

function Wallpaper({
    label,
    image,
    centerImage,
    selected,
    onPress,
}: {
    label: string;
    image: ImageSourcePropType;
    centerImage?: boolean;
    selected: boolean;
    onPress: () => void;
}) {
    const dims = RN.Dimensions.get("window");
    const styles = useStyles();

    const width = dims.width / 4;
    const height = dims.width / 2;

    return (
        <RN.View>
            <PressableScale
                onPress={onPress}
                style={[
                    styles.thing,
                    { width, height },
                    centerImage && styles.centerThing,
                    selected && styles.selectedThing,
                ]}
            >
                <RN.Image
                    source={image}
                    style={
                        centerImage
                            ? styles.centerImage
                            : { width: "100%", height: "100%", borderRadius: 8 } as any
                    }
                    resizeMode="cover"
                />
            </PressableScale>
            <Text
                variant="text-sm/semibold"
                color="TEXT_DEFAULT"
                style={{ marginTop: 8, textAlign: "center" }}
            >
                {label}
            </Text>
        </RN.View>
    );
}

function WallpaperCollection({
    collection,
    configurable,
}: {
    collection: Collection;
    configurable?: {
        add: (title: string, location: string) => void;
        remove: (entry: CollectionEntry) => void;
    };
}) {
    const config = useMonetSettings(s => s.config);
    const updateSettings = useMonetSettings(s => s.updateSettings);

    return (
        <RN.View>
            <Text
                variant="text-md/medium"
                color="TEXT_DEFAULT"
                style={{ marginBottom: 8 }}
            >
                {collection.label}
            </Text>
            <RN.ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {configurable && (
                    <Wallpaper
                        label="Add"
                        image={findAssetId("ImagePlusIcon") as any}
                        centerImage
                        selected={false}
                        onPress={() => {
                            showSheet(
                                SHEET_KEY,
                                AddBackgroundSheet,
                                { add: configurable.add },
                            );
                        }}
                    />
                )}
                {collection.content.map(x => (
                    <Wallpaper
                        key={x.url}
                        label={x.title}
                        image={{ uri: x.url }}
                        selected={config.wallpaper === x.url}
                        onPress={() => {
                            if (config.wallpaper === x.url) {
                                showToast(
                                    "Removed background",
                                    findAssetId("TrashIcon"),
                                );
                                updateSettings({
                                    config: { ...config, wallpaper: "none" },
                                });
                            } else {
                                showToast(
                                    `Set background to ${x.title}`,
                                    findAssetId("ImagePlusIcon"),
                                );
                                updateSettings({
                                    config: { ...config, wallpaper: x.url },
                                });
                            }
                        }}
                    />
                ))}
            </RN.ScrollView>
        </RN.View>
    );
}

export default function ConfigurePage() {
    const config = useMonetSettings(s => s.config);
    const updateSettings = useMonetSettings(s => s.updateSettings);

    const bestVariant = getDiscordTheme() !== "light" ? "dark" : "light";
    const collections = wallpapers.filter(
        x => x.variant === bestVariant || x.variant === "any",
    );

    return (
        <RN.ScrollView style={{ flex: 1 }}>
            <RN.View style={{ padding: 16, gap: 16 }}>
                <RN.View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <RN.Image
                        source={findAssetId("ImageIcon")}
                        style={{ width: 20, height: 20, tintColor: "#fff" } as any}
                    />
                    <Text variant="text-lg/semibold" color="TEXT_NORMAL">
                        Backgrounds
                    </Text>
                </RN.View>
                {collections.map(x => (
                    <React.Fragment key={x.label}>
                        <WallpaperCollection collection={x} />
                        <RN.View style={{ height: 8 }} />
                    </React.Fragment>
                ))}
                <WallpaperCollection
                    configurable={{
                        add: (title, location) => {
                            updateSettings({
                                config: {
                                    ...config,
                                    custom: [
                                        ...config.custom,
                                        { title, url: location },
                                    ],
                                },
                            });
                        },
                        remove: entry => {
                            updateSettings({
                                config: {
                                    ...config,
                                    custom: config.custom.filter(x => x.url !== entry.url),
                                },
                            });
                        },
                    }}
                    collection={{
                        label: "Custom",
                        variant: "any",
                        content: config.custom,
                    }}
                />
            </RN.View>
            <RN.View style={{ marginBottom: 12 }} />
        </RN.ScrollView>
    );
}

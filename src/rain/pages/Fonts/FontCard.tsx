import { findAssetId } from "@api/assets";
import { readFile } from "@api/native/fs";
import { BundleUpdaterManager } from "@api/native/modules";
import { showConfirmationAlert } from "@api/ui/alerts";
import { createStyles, TextStyleSheet } from "@api/ui/styles";
import { lazyDestructure } from "@lib/utils/lazy";
import { findByProps } from "@metro";
import { NavigationNative, tokens } from "@metro/common";
import { Button, Card, IconButton, Stack, Text } from "@metro/common/components";
import { FontDefinition, selectFont, useFonts } from "@plugins/_core/painter/fonts";
import { CardWrapper } from "@rain/pages/Addon/AddonCard";
import { useEffect, useMemo, useState } from "react";
import { PixelRatio, View } from "react-native";

import FontEditor from "./FontEditor";

const { useToken } = lazyDestructure(() => findByProps("useToken"));

const useStyles = createStyles({
    full: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%"
    }
});

function FontPreview({ font }: { font: FontDefinition; }) {
    const [loaded, setLoaded] = useState(false);
    const styles = useStyles();

    const [fontUri, setFontUri] = useState<string | null>(null);

    const TEXT_DEFAULT = useToken(tokens.colors.TEXT_DEFAULT);
    const { fontFamily: fontFamilyList, fontSize } = TextStyleSheet["text-md/medium"];
    const fontFamily = fontFamilyList!.split(/,/g)[0];

    useEffect(() => {
        const getFontUri = async () => {
            const url = font.main[fontFamily];
            if (!url) return;

            let ext = url.split(".").pop()?.toLowerCase();
            if (ext !== "ttf" && ext !== "otf") ext = "ttf";

            const path = `downloads/fonts/${font.name}/${fontFamily}.${ext}`;

            try {
                const base64Data = await readFile(path, { encoding: "base64" });
                const mimeType = ext === "otf" ? "opentype" : "truetype";
                setFontUri(`data:font/${mimeType};base64,${base64Data}`);
            } catch (e) {
                console.error("Failed to load font for preview:", e);
            }
        };

        getFontUri();
    }, [font, fontFamily]);

    const props = useMemo(() => ({
        family: fontUri,
        size: fontSize! * PixelRatio.getFontScale(),
        color: TEXT_DEFAULT,
        text:
            "The quick brown fox jumps over the lazy dog",
    }), [fontUri, fontSize, TEXT_DEFAULT]);

    return <View style={{ width: "100%", height:32 }}>
        {!loaded && <View style={[styles.full, { justifyContent: "center", alignItems: "center" }]}>
            <Text color="text-muted" variant="heading-lg/semibold">
                Loading...
            </Text>
        </View>}
    </View>;
}

export default function FontCard({ item: font }: CardWrapper<FontDefinition>) {
    const selectedFont = useFonts(state => state.fonts.__selected);
    const navigation = NavigationNative.useNavigation();
    const selected = selectedFont === font.name;

    return (
        <Card>
            <Stack spacing={16}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View>
                        <Text variant="heading-lg/semibold">
                            {font.name}
                        </Text>
                        {/* TODO: Text wrapping doesn't work well */}
                        {/* <Text color="text-muted" variant="text-sm/semibold">
                            {font.description}
                        </Text> */}
                    </View>
                    <View style={{ marginLeft: "auto" }}>
                        <Stack spacing={12} direction="horizontal">
                            <IconButton
                                onPress={() => {
                                    navigation.push("RAIN_CUSTOM_PAGE", {
                                        title: "Edit Font",
                                        render: () => <FontEditor name={font.name} />
                                    });
                                }}
                                size="sm"
                                variant="secondary"
                                disabled={selected}
                                icon={findAssetId("WrenchIcon")}
                            />
                            <Button
                                size="sm"
                                variant={selected ? "secondary" : "primary"}
                                text={selected ? "Unapply" : "Apply"}
                                onPress={async () => {
                                    await selectFont(selected ? null : font.name);
                                    showConfirmationAlert({
                                        title: "Hold up!",
                                        content: "Reload Discord to apply changes?",
                                        confirmText: "Reload",
                                        cancelText: "Cancel",
                                        confirmColor: "red",
                                        onConfirm: BundleUpdaterManager.reload
                                    });
                                }}
                            />
                        </Stack>
                    </View>
                </View>
                <FontPreview font={font} />
            </Stack>
        </Card>
    );
}

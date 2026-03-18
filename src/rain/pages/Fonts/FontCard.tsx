import { findAssetId } from "@api/assets";
import { readFile } from "@api/native/fs";
import { BundleUpdaterManager } from "@api/native/modules";
import { showConfirmationAlert } from "@api/ui/alerts";
import { createStyles, TextStyleSheet } from "@api/ui/styles";
import { Strings } from "@i18n";
import { lazyDestructure } from "@lib/utils/lazy";
import { findByProps } from "@metro";
import { NavigationNative, tokens } from "@metro/common";
import { Button, Card, IconButton, Stack, Text } from "@metro/common/components";
import { FontDefinition, selectFont, useFonts } from "@plugins/_core/painter/fonts";
import { CardWrapper } from "@rain/pages/Addon/AddonCard";
import { useEffect, useMemo, useState } from "react";
import { PixelRatio, Platform,View } from "react-native";

import FontEditor from "./FontEditor";
import previewHtml from "./preview.html";

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
    const [WebView, setWebView] = useState<any>(null);
    const [isReady, setIsReady] = useState(false);
    const styles = useStyles();

    const [fontUri, setFontUri] = useState<string | null>(null);

    const TEXT_DEFAULT = useToken(tokens.colors.TEXT_DEFAULT);
    const { fontFamily: fontFamilyList, fontSize } = TextStyleSheet["text-md/medium"];
    const fontFamily = fontFamilyList!.split(/,/g)[0];

    useEffect(() => {
        if (Platform.OS === "android") {
            const webViewModule = findByProps("WebView");
            if (webViewModule?.WebView) {
                setWebView(() => webViewModule.WebView);
            }
        }
    }, []);

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

    useEffect(() => {
        if (WebView && fontUri) {
            setIsReady(true);
        }
    }, [WebView, fontUri]);

    const props = useMemo(() => ({
        family: fontUri,
        size: fontSize! * PixelRatio.getFontScale(),
        color: TEXT_DEFAULT,
        text: Strings.GENERAL.CORE.PREVIEW_TEXT,
    }), [fontUri, fontSize, TEXT_DEFAULT]);

    if (Platform.OS === "android" && isReady && WebView) {
        return (
            <View style={{ width: "100%", height: 32 }}>
                <WebView
                    onMessage={() => setLoaded(true)}
                    source={{
                        html: previewHtml.replace("$$props", JSON.stringify(props))
                    }}
                    javaScriptEnabled
                    scrollEnabled={false}
                    overScrollMode="never"
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    pointerEvents="none"
                    style={[styles.full, { backgroundColor: "transparent", opacity: Number(loaded) }]}
                />
                {!loaded && (
                    <View style={[styles.full, { justifyContent: "center", alignItems: "center" }]}>
                        <Text color="text-muted" variant="heading-lg/semibold">
                            {Strings.GENERAL.CORE.LOADING}
                        </Text>
                    </View>
                )}
            </View>
        );
    } else if (Platform.OS === "android" && !isReady) {
        return (
            <View style={{ width: "100%", height: 32 }}>
                <View style={[styles.full, { justifyContent: "center", alignItems: "center" }]}>
                    <Text color="text-muted" variant="heading-lg/semibold">
                        {Strings.GENERAL.CORE.LOADING_PREVIEW}
                    </Text>
                </View>
            </View>
        );
    } else {
        // todo: fix ios fonts (they dont have skia either)
        return (
            <View style={{ width: "100%", height: 32 }}>
                <View style={[styles.full, { justifyContent: "center", alignItems: "center" }]}>
                    <Text color="text-muted" variant="heading-lg/semibold">
                        {Strings.GENERAL.CORE.PREVIEW_NOT_SUPPORTED_IOS}
                    </Text>
                </View>
            </View>
        );
    }
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
                                        title: Strings.GENERAL.CORE.EDIT_FONT,
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
                                text={selected ? Strings.GENERAL.CORE.UNAPPLY : Strings.GENERAL.CORE.APPLY}
                                onPress={async () => {
                                    await selectFont(selected ? null : font.name);
                                    showConfirmationAlert({
                                        title: Strings.GENERAL.CORE.HOLD_UP,
                                        content: Strings.GENERAL.CORE.RELOAD_DISCORD,
                                        confirmText: Strings.GENERAL.CORE.RELOAD,
                                        cancelText: Strings.GENERAL.CORE.CANCEL,
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

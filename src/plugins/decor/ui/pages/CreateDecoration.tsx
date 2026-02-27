import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import { createStyles } from "@api/ui/styles";
import { showToast } from "@api/ui/toasts";
import { findByProps } from "@metro";
import { React, ReactNative } from "@metro/common";
import {
    Button,
    HelpMessage,
    Stack,
    TableRow,
    TableRowGroup,
    Text,
    TextInput,
} from "@metro/common/components";
import { Pressable, ScrollView, View } from "react-native";
import type { Asset } from "react-native-image-picker";

import { RAW_SKU_ID } from "../../lib/constants";
import { useCurrentUserDecorationsStore } from "../../lib/stores/CurrentUserDecorationsStore";
import readFileAsBase64 from "../../lib/utils/readFileAsBase64";
import AvatarDecorationPreviews from "../components/AvatarDecorationPreviews";

const { launchImageLibrary } = findByProps("launchImageLibrary") as typeof import("react-native-image-picker");
const { useSafeAreaInsets } = findByProps("useSafeAreaInsets");
const { useNavigation } = findByProps("useNavigation");
const Parser = findByProps("parseTopic");

const useStyles = createStyles(_ => ({
    root: {
        flex: 1,
        backgroundColor: semanticColors.BG_BASE_PRIMARY,
    },
    content: {
        paddingHorizontal: 16,
        paddingVertical: 24,
        gap: 16,
    },
    footer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        gap: 8,
    },
    guidelinesText: {
        fontSize: 13,
        lineHeight: 18,
        color: semanticColors.TEXT_MUTED,
        paddingHorizontal: 16,
        paddingTop: 4,
    },
}));

export default function CreateDecoration() {
    const [asset, setAsset] = React.useState<Asset | null>(null);
    const [alt, setAlt] = React.useState("");
    const [creating, setCreating] = React.useState(false);
    const [error, setError] = React.useState<Error | null>(null);

    React.useEffect(() => {
        if (error) setError(null);
    }, [asset]);

    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const createDecoration = useCurrentUserDecorationsStore(state => state.create);
    const styles = useStyles();

    const isDisabled = !asset || !alt.trim() || asset.type !== "image/png" || !!error;

    return (
        <View style={styles.root}>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={ReactNative.Platform.OS === "ios"}
            >
                <View style={styles.content}>
                    <AvatarDecorationPreviews
                        pendingAvatarDecoration={
                            asset ? { asset: asset?.uri, skuId: RAW_SKU_ID } : null
                        }
                    />

                    {error && (
                        <HelpMessage messageType={0}>
                            {error.message}
                        </HelpMessage>
                    )}

                    <Stack spacing={4}>
                        <TableRowGroup title="Image">
                            <TableRow
                                label="Select Image"
                                subLabel={asset?.fileName ?? "No image selected — tap to browse"}
                                icon={
                                    <TableRow.Icon
                                        source={findAssetId(
                                            asset ? "ic_image_text_channel" : "ic_image"
                                        )}
                                    />
                                }
                                trailing={
                                    asset ? (
                                        <Pressable
                                            onPress={() => setAsset(null)}
                                            hitSlop={8}
                                            style={{ padding: 4 }}
                                        >
                                            <TableRow.Icon source={findAssetId("ic_close_circle_24px")} />
                                        </Pressable>
                                    ) : TableRow.Arrow
                                }
                                onPress={() => {
                                    launchImageLibrary(
                                        { mediaType: "photo" },
                                        ret => {
                                            if (!ret || ret.didCancel) return;
                                            const picked = ret.assets?.[0];
                                            if (picked) setAsset(picked);
                                        }
                                    );
                                }}
                            />
                        </TableRowGroup>
                        <Text style={styles.guidelinesText}>
                            File must be a PNG or APNG.
                            {ReactNative.Platform.OS === "android"
                                ? " APNGs will not animate in the preview on Android."
                                : ""}
                        </Text>
                    </Stack>

                    <TextInput
                        label="Decoration Name"
                        placeholder="e.g. Companion Cube"
                        value={alt}
                        onChange={setAlt}
                        returnKeyType="done"
                    />

                    <HelpMessage messageType={1}>
                        {Parser.parse(
                            "Make sure your decoration does not violate [the guidelines](https://github.com/decor-discord/.github/blob/main/GUIDELINES.md) before submitting.",
                            true,
                            { allowLinks: true }
                        )}
                    </HelpMessage>
                </View>
            </ScrollView>

            <View
                style={[
                    styles.footer,
                    { paddingBottom: Math.max(insets.bottom, 24) },
                ]}
            >
                <Button
                    text={creating ? "Creating…" : "Create Decoration"}
                    size="lg"
                    variant="primary"
                    loading={creating}
                    disabled={isDisabled}
                    onPress={async () => {
                        setCreating(true);
                        try {
                            let uri: string;
                            if (ReactNative.Platform.OS === "ios") {
                                uri = "data:" + asset!.type + ";base64," + (await readFileAsBase64(asset!.uri));
                            } else {
                                uri = asset!.uri;
                            }
                            await createDecoration({
                                uri,
                                fileName: asset!.fileName,
                                fileType: asset!.type,
                                alt,
                            });
                            navigation.goBack();
                            showToast("Decoration created and pending review.", findAssetId("Check"));
                        } catch (e) {
                            setError(e as Error);
                            setCreating(false);
                        }
                    }}
                />
            </View>
        </View>
    );
}

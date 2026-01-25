import { CardWrapper } from "@rain/pages/Addon/AddonCard";
import { showConfirmationAlert } from "@api/ui/alerts";
import { useFonts, FontDefinition, selectFont } from "@plugins/_core/painter/fonts";
import { findAssetId } from "@api/assets";
import { BundleUpdaterManager } from "@api/native/modules";
import { lazyDestructure } from "@lib/utils/lazy";
import { findByProps } from "@metro";
import { NavigationNative, tokens } from "@metro/common";
import { Button, Card, IconButton, Stack, Text } from "@metro/common/components";
import { View } from "react-native";
import FontEditor from "./FontEditor";

const { useToken } = lazyDestructure(() => findByProps("useToken"));

export default function FontCard({ item: font }: CardWrapper<FontDefinition>) {
    const selectedFont = useFonts((state) => state.fonts.__selected);
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
                                    navigation.push("BUNNY_CUSTOM_PAGE", {
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
            </Stack>
        </Card>
    );
}
import { findAssetId } from "@api/assets";
import { findByProps } from "@metro";
import { NavigationNative, ReactNative } from "@metro/common";
import { Stack, TableCheckboxRow, TableRow,TableRowGroup } from "@metro/common/components";

import { useTranslatorSettings } from "../storage";
import TargetLang from "./TargetLang";

const { ScrollView, Text } = ReactNative;
const { showSimpleActionSheet } = findByProps("showSimpleActionSheet");
const { hideActionSheet } = findByProps("openLazy", "hideActionSheet");

export default function Settings() {
    const navigation = NavigationNative.useNavigation();
    const settings = useTranslatorSettings();

    const showTranslatorSheet = () => {
        showSimpleActionSheet({
            key: "TranslatorSelect",
            header: {
                title: "Select Translator"
            },
            options: [
                {
                    label: "DeepL",
                    onPress: () => {
                        settings.updateSettings({ translator: 0 });
                        hideActionSheet();
                    }
                },
                {
                    label: "Google Translate",
                    onPress: () => {
                        settings.updateSettings({ translator: 1 });
                        hideActionSheet();
                    }
                }
            ]
        });
    };

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Settings">
                    <TableCheckboxRow
                        label={"Immersive Translation"}
                        subLabel={"Display both original and translation"}
                        icon={<TableRow.Icon source={findAssetId("ic_chat_bubble_32px")} />}
                        checked={settings.immersive_enabled ?? true}
                        onPress={() => settings.updateSettings({ immersive_enabled: !settings.immersive_enabled })}
                    />
                    <TableRow
                        label={"Translate to"}
                        subLabel={settings.target_lang?.toLowerCase()}
                        icon={<TableRow.Icon source={findAssetId("LanguageIcon")} />}
                        trailing={() => <TableRow.Arrow />}
                        onPress={() => navigation.push("RAIN_CUSTOM_PAGE", {
                            title: "Translate to",
                            render: TargetLang,
                        })}
                    />
                    <TableRow
                        label={"Translator"}
                        subLabel={settings.translator ? "Google Translate" : "DeepL"}
                        icon={<TableRow.Icon source={findAssetId("LocationIcon")} />}
                        trailing={() => <TableRow.Arrow />}
                        onPress={showTranslatorSheet}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}

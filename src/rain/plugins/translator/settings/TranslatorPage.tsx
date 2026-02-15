import { findAssetId } from "@api/assets"
import { ReactNative } from "@metro/common"
import { Stack, TableRowGroup, TableRow } from "@metro/common/components"
import { showToast } from "@api/ui/toasts"
import { useTranslatorSettings } from "../storage"

const { ScrollView } = ReactNative

export default function TranslatorPage() {
    const settings = useTranslatorSettings()

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Select Translator">
                    <TableRow
                        label="DeepL"
                        trailing={() => <TableRow.Arrow />}
                        onPress={() => {
                            if (settings.translator == 0) return
                            settings.updateSettings({ translator: 0 })
                            showToast(`Saved Translator to DeepL`, findAssetId("check"))
                        }}
                    />
                    <TableRow
                        label="Google Translate"
                        trailing={() => <TableRow.Arrow />}
                        onPress={() => {
                            if (settings.translator == 1) return
                            settings.updateSettings({ translator: 1 })
                            showToast(`Saved Translator to Google Translate`, findAssetId("check"))
                        }}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    )
}

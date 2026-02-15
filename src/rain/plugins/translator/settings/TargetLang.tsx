import { Search } from "@api/ui/components";
import { React } from "@metro/common";
import { ReactNative } from "@metro/common";
import { Stack, TableRadioGroup, TableRadioRow } from "@metro/common/components";

import { DeepLLangs, GTranslateLangs } from "../lang";
import { useTranslatorSettings } from "../storage";

const { ScrollView } = ReactNative;

export default function TargetLang() {
    const settings = useTranslatorSettings();
    const [query, setQuery] = React.useState("");

    const langs = settings.translator === 0 ? DeepLLangs : GTranslateLangs;
    const filteredLangs = Object.entries(langs).filter(([key]) =>
        key.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
            <Search
                style={{ padding: 15 }}
                placeholder="Search Language"
                onChangeText={setQuery}
                isRound={true}
            />
            <Stack style={{ paddingHorizontal: 12 }} spacing={24}>
                <TableRadioGroup
                    title="Select Language"
                    value={settings.target_lang?.toLowerCase() ?? "en"}
                    onChange={(value: string) => {
                        settings.updateSettings({ target_lang: value });
                    }}
                >
                    {filteredLangs.map(([key, value]) => (
                        <TableRadioRow
                            key={key}
                            label={key}
                            subLabel={value as string}
                            value={(value as string).toLowerCase()}
                        />
                    ))}
                </TableRadioGroup>
            </Stack>
        </ScrollView>
    );
}

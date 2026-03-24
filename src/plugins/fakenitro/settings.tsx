import { findByProps } from "@metro";
import { ReactNative as RN } from "@metro/common";
import { ScrollView } from "react-native";
import { Strings } from "@rain/i18n";

import { useFakeNitroSettings } from "./storage";

const {
    TableSwitchRow,
    TableRadioGroup,
    TableRadioRow,
    TableRowGroup,
} = findByProps("TableRow");
const { Stack } = findByProps("Stack");

const sizeOptions = {
    Tiny: 16,
    Small: 32,
    Medium: 48,
    Large: 64,
    Huge: 96,
    Jumbo: 128,
};

const previewUri = "https://cdn.discordapp.com/emojis/926602689213767680.webp";

export default () => {
    const settings = useFakeNitroSettings();
    const { updateSettings } = settings;

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack
                style={{ paddingVertical: 24, paddingHorizontal: 12 }}
                spacing={24}
            >
                <TableRadioGroup
                    title={Strings.PLUGINS.CUSTOM.FAKENITRO.SETTINGS.EMOJI_SIZE}
                    defaultValue={settings.emojiSize.toString()}
                    onChange={(v: string) =>
                        updateSettings({ emojiSize: parseInt(v) })
                    }
                >
                    {Object.entries(sizeOptions).map(([name, size]) => (
                        <TableRadioRow
                            label={name}
                            subLabel={size}
                            key={size.toString()}
                            value={size.toString()}
                        />
                    ))}
                </TableRadioGroup>
                <TableRowGroup title={Strings.PLUGINS.CUSTOM.FAKENITRO.SETTINGS.PREVIEW}>
                    <RN.Image
                        source={{
                            uri: `${previewUri}?size=${settings.emojiSize}`,
                            width: settings.emojiSize,
                            height: settings.emojiSize,
                        }}
                    />
                </TableRowGroup>
                <TableRowGroup title={Strings.PLUGINS.CUSTOM.FAKENITRO.SETTINGS.EMOJIS} titleStyleType="no_border">
                    <TableSwitchRow
                        label={Strings.PLUGINS.CUSTOM.FAKENITRO.SETTINGS.USE_HYPERLINK_EMOJIS}
                        onValueChange={(v: boolean) => {
                            updateSettings({ hyperLink: v });
                        }}
                        value={settings.hyperLink}
                    />
                </TableRowGroup>
                <TableRowGroup title={Strings.PLUGINS.CUSTOM.FAKENITRO.SETTINGS.STICKERS} titleStyleType="no_border">
                    <TableSwitchRow
                        label={Strings.PLUGINS.CUSTOM.FAKENITRO.SETTINGS.USE_HYPERLINK_STICKERS}
                        onValueChange={(v: boolean) => {
                            updateSettings({ stickerHyperLink: v });
                        }}
                        value={settings.stickerHyperLink}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
};

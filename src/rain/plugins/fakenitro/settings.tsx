import {findByProps} from "@metro";
import {fakenitroSettings} from "./storage";
import {ReactNative as RN} from "@metro/common";
import {ScrollView} from "react-native";

const {
    TableSwitchRow,
    TableRadioGroup,
    TableRadioRow,
    TableRowGroup,
} = findByProps("TableRow");
const {Stack} = findByProps("Stack");

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
    return (
        <ScrollView style={{flex: 1}}>
            <Stack
                style={{paddingVertical: 24, paddingHorizontal: 12}}
                spacing={24}
            >
                <TableRadioGroup
                    title="Emoji size"
                    defaultValue={fakenitroSettings.emojiSize.toString()}
                    onChange={(v: string) =>
                        (fakenitroSettings.emojiSize = parseInt(v))
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
                <TableRowGroup title="Preview">
                    <RN.Image
                        source={{
                            uri: `${previewUri}?size=${fakenitroSettings.emojiSize}`,
                            width: fakenitroSettings.emojiSize,
                            height: fakenitroSettings.emojiSize,
                        }}
                    />
                </TableRowGroup>
                <TableRowGroup title="Emojis" titleStyleType="no_border">
                    <TableSwitchRow
                        label="Use hyperlinks when sending fake emojis"
                        onValueChange={(v: boolean) => {
                            fakenitroSettings.hyperLink = v;
                        }}
                        value={fakenitroSettings.hyperLink}
                    />
                </TableRowGroup>
                <TableRowGroup title="Stickers" titleStyleType="no_border">
                    <TableSwitchRow
                        label="Use hyperlinks when sending fake stickers"
                        onValueChange={(v: boolean) => {
                            fakenitroSettings.stickerHyperLink = v;
                        }}
                        value={fakenitroSettings.stickerHyperLink}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
};

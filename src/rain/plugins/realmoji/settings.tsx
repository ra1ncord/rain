import {findByProps} from "@metro";
import {realmojiSettings} from "./storage";
import {ScrollView} from "react-native";

const {
    TableSwitchRow,
    TableRowGroup,
} = findByProps("TableRow");
const {Stack} = findByProps("Stack");

export default () => {
    return (
        <ScrollView style={{flex: 1}}>
            <Stack
                style={{paddingVertical: 24, paddingHorizontal: 12}}
                spacing={24}
            >
                <TableRowGroup title="Emojis" titleStyleType="no_border">
                    <TableSwitchRow
                        label="Transform fake emojis into real ones"
                        onValueChange={(v: boolean) => {
                            realmojiSettings.transformEmoji = v;
                        }}
                        value={realmojiSettings.transformEmoji}
                    />
                </TableRowGroup>
                <TableRowGroup title="Stickers" titleStyleType="no_border">
                    <TableSwitchRow
                        label="Transform fake stickers into real ones"
                        onValueChange={(v: boolean) => {
                            realmojiSettings.transformSticker = v;
                        }}
                        value={realmojiSettings.transformSticker}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
};

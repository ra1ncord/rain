import {findByProps} from "@metro";
import {realnitroSettings} from "./storage";
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
                <TableRowGroup title="User Profile" titleStyleType="no_border">
                    <TableSwitchRow
                        label="Transform fake emojis into real ones"
                        onValueChange={(v: boolean) => {
                            realnitroSettings.transformEmoji = v;
                        }}
                        value={realnitroSettings.transformEmoji}
                    />
                </TableRowGroup>
                <TableRowGroup title="Stickers" titleStyleType="no_border">
                    <TableSwitchRow
                        label="Transform fake stickers into real ones"
                        onValueChange={(v: boolean) => {
                            realnitroSettings.transformSticker = v;
                        }}
                        value={realnitroSettings.transformSticker}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
};

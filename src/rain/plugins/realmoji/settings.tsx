import {findByProps} from "@metro";
import {useRealMojiSettings} from "./storage"; 
import {ScrollView} from "react-native";

const {
    TableSwitchRow,
    TableRowGroup,
} = findByProps("TableRow");
const {Stack} = findByProps("Stack");

export default () => {
    const settings = useRealMojiSettings();

    return (
        <ScrollView style={{flex: 1}}>
            <Stack
                style={{paddingVertical: 24, paddingHorizontal: 12}}
                spacing={24}
            >
                <TableRowGroup title="Realmoji" titleStyleType="no_border">
                    <TableSwitchRow
                        label="Transform fake emojis into real ones"
                        onValueChange={(v: boolean) => {
                            settings.updateSettings({ transformEmoji: v });
                        }}
                        value={settings.transformEmoji ?? true}
                    />
                    <TableSwitchRow
                        label="Transform fake stickers into real ones"
                        onValueChange={(v: boolean) => {
                            settings.updateSettings({ transformSticker: v });
                        }}
                        value={settings.transformSticker ?? true}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
};

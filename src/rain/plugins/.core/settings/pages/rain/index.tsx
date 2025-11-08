import { findAssetId } from "@lib/api/assets";
import { NavigationNative } from "@metro/common";
import { AlertActionButton, AlertActions, AlertModal, Stack, TableRow, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { Linking, ScrollView } from "react-native";
import CodebergIcon from "@assets/icons/codeberg-logo_icon_white.png";

export default function rainSettings() {

    const navigation = NavigationNative.useNavigation();

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title={"rain"}>
                    <TableRow
                        label={"rain"}
                        icon={<TableRow.Icon source={findAssetId("RobotIcon")!} />}
                    />
                    <TableRow
                        label={"Discord"}
                        icon={<TableRow.Icon source={findAssetId("Discord")!} />}
                    />
                </TableRowGroup>
                <TableRowGroup title={"links"}>
                    <TableRow
                        arrow={true}
                        label={"discord"}
                        icon={<TableRow.Icon source={findAssetId("Discord")!} />}
                        onPress={() => Linking.openURL("https://discord.gg/6cN7wKa8gp")}
                    />
                    <TableRow
                        arrow={true}
                        label={"codeberg"}
                        icon={<TableRow.Icon source={{ uri: CodebergIcon}} />}
                        onPress={() => Linking.openURL("https://codeberg.org/raincord")}
                    />
                    <TableRow
                        arrow={true}
                        label={"github"}
                        icon={<TableRow.Icon source={findAssetId("img_account_sync_github_white")!} />}
                        onPress={() => Linking.openURL("https://github.com/ra1ncord")}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}

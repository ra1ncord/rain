import { findAssetId } from "@lib/api/assets";
import { NavigationNative } from "@metro/common";
import { AlertActionButton, AlertActions, AlertModal, Stack, TableRow, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { Linking, ScrollView } from "react-native";

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
            </Stack>
        </ScrollView>
    );
}

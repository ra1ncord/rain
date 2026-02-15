import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import { ReactNative as RN } from "@metro/common";
import { NavigationNative } from "@metro/common";
import { Stack, TableRow, TableRowGroup,TableSwitchRow } from "@metro/common/components";

import { useMoreCommandsSettings } from "../../storage";
import NekosLifeCategoriesPage from "./NekosLifeCategoriesPage";

export default function AliucordPage() {
    const storage = useMoreCommandsSettings();
    const navigation = NavigationNative.useNavigation();

    return (
        <RN.ScrollView style={{ flex: 1, backgroundColor: semanticColors.BACKGROUND_PRIMARY }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="IP Commands">
                    <TableSwitchRow
                        label="/ip"
                        subLabel="Get your current IP address"
                        icon={<TableRow.Icon source={findAssetId("GlobeEarthIcon")} />}
                        value={storage.enabledCommands.ip}
                        onValueChange={(v) => {
                            storage.updateEnabledCommands({ ip: v });
                            storage.setPendingRestart(true);
                        }}
                    />
                </TableRowGroup>

                <TableRowGroup title="NekosLife Commands">
                    <TableSwitchRow
                        label="/nekoslife"
                        subLabel="Get images/gifs from nekos.life"
                        icon={<TableRow.Icon source={findAssetId("ImageIcon")} />}
                        value={storage.enabledCommands.nekoslife}
                        onValueChange={(v) => {
                            storage.updateEnabledCommands({ nekoslife: v });
                            storage.setPendingRestart(true);
                        }}
                    />
                    <TableRow
                        label="View Categories"
                        subLabel="See all 16 available categories"
                        icon={<TableRow.Icon source={findAssetId("BookOpenIcon")} />}
                        arrow
                        onPress={() =>
                            navigation.push("RAIN_CUSTOM_PAGE", {
                                title: "NekosLife Categories",
                                render: NekosLifeCategoriesPage,
                            })
                        }
                    />
                </TableRowGroup>
            </Stack>
        </RN.ScrollView>
    );
}

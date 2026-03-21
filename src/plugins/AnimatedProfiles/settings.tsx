import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import { Stack, TableRadioGroup, TableRadioRow, TableRow, TableRowGroup } from "@metro/common/components";
import { ScrollView } from "react-native";

import { fetchData as fetchUserBgData } from "./patches/userbg";
import { fetchData as fetchUserPfpData } from "./patches/userpfp";
import { AnimatedProfilesMode, useAnimatedProfilesSettings } from "./storage";

export default function AnimatedProfilesSettings() {
    const { mode, updateSettings } = useAnimatedProfilesSettings();

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRadioGroup
                    title="Choose your prefered mode"
                    value={mode}
                    onChange={(v: string) => updateSettings({ mode: v as AnimatedProfilesMode })}
                >
                    <TableRadioRow
                        label="Both Enabled"
                        subLabel="Use both UserPFP and UserBG"
                        value={AnimatedProfilesMode.Both}
                    />
                    <TableRadioRow
                        label="User PFP Only"
                        subLabel="Only use UserPFP"
                        value={AnimatedProfilesMode.UserPFPOnly}
                    />
                    <TableRadioRow
                        label="User BG Only"
                        subLabel="Only use UserBG"
                        value={AnimatedProfilesMode.UserBGOnly}
                    />
                </TableRadioGroup>

                <TableRowGroup title="Info">
                    <TableRow
                        label="Request your own UserBG"
                        icon={<TableRow.Icon source={findAssetId("Discord")} />}
                        trailing={TableRow.Arrow}
                        onPress={() => {
                            const { Linking } = require("react-native");
                            Linking.openURL("https://discord.gg/ECg96KZ3Fh");
                        }}
                    />
                    <TableRow
                        label="Request your own UserPFP"
                        icon={<TableRow.Icon source={findAssetId("Discord")} />}
                        trailing={TableRow.Arrow}
                        onPress={() => {
                            const { Linking } = require("react-native");
                            Linking.openURL("https://discord.gg/userpfp-1129784704267210844");
                        }}
                    />
                    <TableRow
                        label="Reload DB"
                        icon={<TableRow.Icon source={findAssetId("RetryIcon")} />}
                        onPress={async () => {
                            if (mode === AnimatedProfilesMode.Both) {
                                await fetchUserBgData();
                                await fetchUserPfpData();
                            } else if (mode === AnimatedProfilesMode.UserBGOnly) {
                                await fetchUserBgData();
                            } else if (mode === AnimatedProfilesMode.UserPFPOnly) {
                                await fetchUserPfpData();
                            }
                            showToast("Reloaded DB", findAssetId("check"));
                        }}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}

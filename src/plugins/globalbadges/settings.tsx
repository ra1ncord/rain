import { Stack, TableCheckboxRow, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { ScrollView } from "react-native";

import { useCustomBadgesSettings } from "./storage";

export default function CustomBadgesSettings() {
    const settings = useCustomBadgesSettings();

    const update = (key: string, value: boolean) => {
        useCustomBadgesSettings.getState().updateSettings({ [key]: value });
    };

    return (
        <ScrollView>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Badge Config">
                    <TableSwitchRow
                        label="Show custom badges first"
                        value={!!settings.left}
                        onValueChange={v => update("left", v)}
                    />
                    <TableSwitchRow
                        label="Show Mod as Prefix"
                        value={!!settings.showPrefix}
                        onValueChange={(value: boolean) => {
                            update("showPrefix", value);
                            if (value && settings.showSuffix) update("showSuffix", false);
                        }}
                    />
                    <TableSwitchRow
                        label="Show Mod as Suffix"
                        value={!!settings.showSuffix}
                        onValueChange={(value: boolean) => {
                            update("showSuffix", value);
                            if (value && settings.showPrefix) update("showPrefix", false);
                        }}
                    />
                </TableRowGroup>

                <TableRowGroup title="Badge Display">
                    <TableCheckboxRow label="Show Aero Badges" checked={!!settings.showAero} onPress={() => update("showAero", !settings.showAero)} />
                    <TableCheckboxRow label="Show Aliucord Badges" checked={!!settings.showAliucord} onPress={() => update("showAliucord", !settings.showAliucord)} />
                    <TableCheckboxRow label="Show BadgeVault Badges" checked={!!settings.showCustom} onPress={() => update("showCustom", !settings.showCustom)} />
                    <TableCheckboxRow label="Show BetterDiscord Badges" checked={!!settings.showBetterDiscord} onPress={() => update("showBetterDiscord", !settings.showBetterDiscord)} />
                    <TableCheckboxRow label="Show Bunny Badges" checked={!!settings.showBunny} onPress={() => update("showBunny", !settings.showBunny)} />
                    <TableCheckboxRow label="Show Enmity Badges" checked={!!settings.showEnmity} onPress={() => update("showEnmity", !settings.showEnmity)} />
                    <TableCheckboxRow label="Show Equicord Badges" checked={!!settings.showEquicord} onPress={() => update("showEquicord", !settings.showEquicord)} />
                    <TableCheckboxRow label="Show GooseMod Badges" checked={!!settings.showGooseMod} onPress={() => update("showGooseMod", !settings.showGooseMod)} />
                    <TableCheckboxRow label="Show Nekocord Badges" checked={!!settings.showNekocord} onPress={() => update("showNekocord", !settings.showNekocord)} />
                    <TableCheckboxRow label="Show Paicord Badges" checked={!!settings.showPaicord} onPress={() => update("showPaicord", !settings.showPaicord)} />
                    <TableCheckboxRow label="Show ReCord Badges" checked={!!settings.showReCord} onPress={() => update("showReCord", !settings.showReCord)} />
                    <TableCheckboxRow label="Show Replugged Badges" checked={!!settings.showReplugged} onPress={() => update("showReplugged", !settings.showReplugged)} />
                    <TableCheckboxRow label="Show Revenge Badges" checked={!!settings.showRevenge} onPress={() => update("showRevenge", !settings.showRevenge)} />
                    <TableCheckboxRow label="Show ReviewDB Badges" checked={!!settings.showReviewDB} onPress={() => update("showReviewDB", !settings.showReviewDB)} />
                    <TableCheckboxRow label="Show Velocity Badges" checked={!!settings.showVelocity} onPress={() => update("showVelocity", !settings.showVelocity)} />
                    <TableCheckboxRow label="Show Vencord Badges" checked={!!settings.showVencord} onPress={() => update("showVencord", !settings.showVencord)} />
                    <TableCheckboxRow label="Show Vendroid Enhanced Badges" checked={!!settings.showVendroidEnhanced} onPress={() => update("showVendroidEnhanced", !settings.showVendroidEnhanced)} />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}

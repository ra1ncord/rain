import { Stack, TableCheckboxRow, TableRadioGroup, TableRadioRow, TableRowGroup, TableRowIcon, TableSwitchRow } from "@metro/common/components";
import { ScrollView } from "react-native";

import { useCustomBadgesSettings } from "./storage";

export default function CustomBadgesSettings() {
    const settings = useCustomBadgesSettings();

    const update = (key: string, value: any) => {
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
                </TableRowGroup>

                <TableRadioGroup
                    title={"Show Mod Style"}
                    value={settings.showModStyle}
                    onChange={(value: string) => {
                        update("showModStyle", value); 
                    }}
                >
                    <TableRadioRow
                        label="Don't Show Mod"
                        value="none"
                    />
                    <TableRadioRow
                        label="Show Mod as Prefix"
                        value="prefix"
                    />
                    <TableRadioRow
                        label="Show Mod as Suffix"
                        value="suffix"
                    />
                </TableRadioGroup>

                <TableRowGroup title="Badge Display">
                    <TableCheckboxRow label="Aero Badges" checked={!!settings.showAero} onPress={() => update("showAero", !settings.showAero)} />
                    <TableCheckboxRow label="Aliucord Badges" checked={!!settings.showAliucord} onPress={() => update("showAliucord", !settings.showAliucord)} />
                    <TableCheckboxRow label="BadgeVault Badges" checked={!!settings.showCustom} onPress={() => update("showCustom", !settings.showCustom)} />
                    <TableCheckboxRow label="BetterDiscord Badges" checked={!!settings.showBetterDiscord} onPress={() => update("showBetterDiscord", !settings.showBetterDiscord)} />
                    <TableCheckboxRow label="Bunny Badges" checked={!!settings.showBunny} onPress={() => update("showBunny", !settings.showBunny)} />
                    <TableCheckboxRow label="Enmity Badges" checked={!!settings.showEnmity} onPress={() => update("showEnmity", !settings.showEnmity)} />
                    <TableCheckboxRow label="Equicord Badges" checked={!!settings.showEquicord} onPress={() => update("showEquicord", !settings.showEquicord)} />
                    <TableCheckboxRow label="GooseMod Badges" checked={!!settings.showGooseMod} onPress={() => update("showGooseMod", !settings.showGooseMod)} />
                    <TableCheckboxRow label="Nekocord Badges" checked={!!settings.showNekocord} onPress={() => update("showNekocord", !settings.showNekocord)} />
                    <TableCheckboxRow label="Paicord Badges" checked={!!settings.showPaicord} onPress={() => update("showPaicord", !settings.showPaicord)} />
                    <TableCheckboxRow label="ReCord Badges" checked={!!settings.showReCord} onPress={() => update("showReCord", !settings.showReCord)} />
                    <TableCheckboxRow label="Replugged Badges" checked={!!settings.showReplugged} onPress={() => update("showReplugged", !settings.showReplugged)} />
                    <TableCheckboxRow label="Revenge Badges" checked={!!settings.showRevenge} onPress={() => update("showRevenge", !settings.showRevenge)} />
                    <TableCheckboxRow label="ReviewDB Badges" checked={!!settings.showReviewDB} onPress={() => update("showReviewDB", !settings.showReviewDB)} />
                    <TableCheckboxRow label="Velocity Badges" checked={!!settings.showVelocity} onPress={() => update("showVelocity", !settings.showVelocity)} />
                    <TableCheckboxRow label="Vencord Badges" checked={!!settings.showVencord} onPress={() => update("showVencord", !settings.showVencord)} />
                    <TableCheckboxRow label="Vendroid Enhanced Badges" checked={!!settings.showVendroidEnhanced} onPress={() => update("showVendroidEnhanced", !settings.showVendroidEnhanced)} />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}

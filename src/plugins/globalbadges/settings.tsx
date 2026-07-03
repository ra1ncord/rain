import { ReactNative } from "@metro/common";
import { Stack, TableRow, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { View } from "react-native";

import { useCustomBadgesSettings } from "./storage";

export default function CustomBadgesSettings() {
    const settings = useCustomBadgesSettings();

    const openDiscord = () => {
        const url = ReactNative.Linking;
        if (url?.openURL) {
            url.openURL("https://discord.gg/eTvYv95PCG");
        }
    };

    const update = (key: string, value: boolean) => {
        useCustomBadgesSettings.getState().updateSettings({ [key]: value });
    };

    return (
        <View>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Badge Display">
                    <TableRow
                        label="Add Custom badges (not affiliated)"
                        arrow={true}
                        onPress={openDiscord}
                    />

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

                    <TableSwitchRow label="Show Custom Badges" value={!!settings.showCustom} onValueChange={(v: boolean) => update("showCustom", v)} />
                    <TableSwitchRow label="Show Vencord Badges" value={!!settings.showVencord} onValueChange={(v: boolean) => update("showVencord", v)} />
                    <TableSwitchRow label="Show Equicord Badges" value={!!settings.showEquicord} onValueChange={(v: boolean) => update("showEquicord", v)} />
                    <TableSwitchRow label="Show Nekocord Badges" value={!!settings.showNekocord} onValueChange={(v: boolean) => update("showNekocord", v)} />
                    <TableSwitchRow label="Show ReviewDB Badges" value={!!settings.showReviewDB} onValueChange={(v: boolean) => update("showReviewDB", v)} />
                    <TableSwitchRow label="Show Aero Badges" value={!!settings.showAero} onValueChange={(v: boolean) => update("showAero", v)} />
                    <TableSwitchRow label="Show Aliucord Badges" value={!!settings.showAliucord} onValueChange={(v: boolean) => update("showAliucord", v)} />
                    <TableSwitchRow label="Show Velocity Badges" value={!!settings.showVelocity} onValueChange={(v: boolean) => update("showVelocity", v)} />
                    <TableSwitchRow label="Show Enmity Badges" value={!!settings.showEnmity} onValueChange={(v: boolean) => update("showEnmity", v)} />
                    <TableSwitchRow label="Show Paicord Badges" value={!!settings.showPaicord} onValueChange={(v: boolean) => update("showPaicord", v)} />
                    <TableSwitchRow label="Show Bunny Badges" value={!!settings.showBunny} onValueChange={(v: boolean) => update("showBunny", v)} />
                    <TableSwitchRow label="Show GooseMod Badges" value={!!settings.showGooseMod} onValueChange={(v: boolean) => update("showGooseMod", v)} />
                    <TableSwitchRow label="Show Replugged Badges" value={!!settings.showReplugged} onValueChange={(v: boolean) => update("showReplugged", v)} />
                    <TableSwitchRow label="Show BetterDiscord Badges" value={!!settings.showBetterDiscord} onValueChange={(v: boolean) => update("showBetterDiscord", v)} />
                    <TableSwitchRow label="Show Vendroid Enhanced Badges" value={!!settings.showVendroidEnhanced} onValueChange={(v: boolean) => update("showVendroidEnhanced", v)} />
                    <TableSwitchRow label="Show Revenge Badges" value={!!settings.showRevenge} onValueChange={(v: boolean) => update("showRevenge", v)} />
                    <TableSwitchRow label="Show ReCord Badges" value={!!settings.showReCord} onValueChange={(v: boolean) => update("showReCord", v)} />
                </TableRowGroup>
            </Stack>
        </View>
    );
}

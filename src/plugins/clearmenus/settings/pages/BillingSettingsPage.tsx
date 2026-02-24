import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import { React, ReactNative } from "@metro/common";
import { Stack, TableRow,TableRowGroup, TableSwitchRow } from "@metro/common/components";

import { useSettingsSections } from "../../storage";

export default function BillingSettingsPage() {
    const settingsSections = useSettingsSections();
    return (
        <ReactNative.ScrollView style={{ flex: 1, backgroundColor: semanticColors.BACKGROUND_PRIMARY }}>
            <Stack spacing={24} style={{ paddingVertical: 24, paddingHorizontal: 12 }}>
                <TableRowGroup title="Billing Settings">
                    <TableSwitchRow
                        label="Hide All"
                        value={!!settingsSections.billing.hideAll}
                        onValueChange={v => settingsSections.updateSettings({ billing: { ...settingsSections.billing, hideAll: v } })}
                    />
                    <TableSwitchRow label="Hide Shop" icon={<TableRow.Icon source={findAssetId("ShopIcon")} />} value={!!settingsSections.billing.collectiblesShop} disabled={!!settingsSections.billing.hideAll} onValueChange={v => settingsSections.updateSettings({ billing: { ...settingsSections.billing, collectiblesShop: v } })} />
                    <TableSwitchRow label="Hide Quests" icon={<TableRow.Icon source={findAssetId("QuestsIcon")} />} value={!!settingsSections.billing.quests} disabled={!!settingsSections.billing.hideAll} onValueChange={v => settingsSections.updateSettings({ billing: { ...settingsSections.billing, quests: v } })} />
                    <TableSwitchRow label="Hide Manage Nitro" icon={<TableRow.Icon source={findAssetId("NitroWheelIcon")} />} value={!!settingsSections.billing.premium} disabled={!!settingsSections.billing.hideAll} onValueChange={v => settingsSections.updateSettings({ billing: { ...settingsSections.billing, premium: v } })} />
                    <TableSwitchRow label="Hide Server Boosts" icon={<TableRow.Icon source={findAssetId("BoostGemIcon")} />} value={!!settingsSections.billing.premiumGuildBoosting} disabled={!!settingsSections.billing.hideAll} onValueChange={v => settingsSections.updateSettings({ billing: { ...settingsSections.billing, premiumGuildBoosting: v } })} />
                    <TableSwitchRow label="Hide Nitro Gifting" icon={<TableRow.Icon source={findAssetId("GiftIcon")} />} value={!!settingsSections.billing.premiumGifting} disabled={!!settingsSections.billing.hideAll} onValueChange={v => settingsSections.updateSettings({ billing: { ...settingsSections.billing, premiumGifting: v } })} />
                    <TableSwitchRow label="Hide Guild Role Subscriptions" value={!!settingsSections.billing.guildRoleSubscriptions} disabled={!!settingsSections.billing.hideAll} onValueChange={v => settingsSections.updateSettings({ billing: { ...settingsSections.billing, guildRoleSubscriptions: v } })} />
                    <TableSwitchRow label="Hide Premium Restore Subscription" value={!!settingsSections.billing.premiumRestoreSubscription} disabled={!!settingsSections.billing.hideAll} onValueChange={v => settingsSections.updateSettings({ billing: { ...settingsSections.billing, premiumRestoreSubscription: v } })} />
                </TableRowGroup>
            </Stack>
        </ReactNative.ScrollView>
    );
}

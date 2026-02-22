import { findByProps } from "@metro";
import { ReactNative as RN } from "@metro/common";
import { ScrollView } from "react-native";

import { useFakeNitroSettings } from "./storage";

const {
    TableSwitchRow,
    TableRadioGroup,
    TableRadioRow,
    TableRowGroup,
} = findByProps("TableRow");
const { Stack } = findByProps("Stack");

const sizeOptions = {
    Tiny: 16,
    Small: 32,
    Medium: 48,
    Large: 64,
    Huge: 96,
    Jumbo: 128,
};

const previewUri = "https://cdn.discordapp.com/emojis/926602689213767680.webp";

export default () => {
    const settings = useFakeNitroSettings();
    const { updateSettings } = settings;

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack
                style={{ paddingVertical: 24, paddingHorizontal: 12 }}
                spacing={24}
            >
                <TableRadioGroup
                    title="Emoji size"
                    defaultValue={settings.emojiSize.toString()}
                    onChange={(v: string) =>
                        updateSettings({ emojiSize: parseInt(v) })
                    }
                >
                    {Object.entries(sizeOptions).map(([name, size]) => (
                        <TableRadioRow
                            label={name}
                            subLabel={size}
                            key={size.toString()}
                            value={size.toString()}
                        />
                    ))}
                </TableRadioGroup>
                <TableRowGroup title="Preview">
                    <RN.Image
                        source={{
                            uri: `${previewUri}?size=${settings.emojiSize}`,
                            width: settings.emojiSize,
                            height: settings.emojiSize,
                        }}
                    />
                </TableRowGroup>
                <TableRowGroup title="Emojis" titleStyleType="no_border">
                    <TableSwitchRow
                        label="Use hyperlinks when sending fake emojis"
                        onValueChange={(v: boolean) => {
                            updateSettings({ hyperLink: v });
                        }}
                        value={settings.hyperLink}
                    />
                </TableRowGroup>
                <TableRowGroup title="Stickers" titleStyleType="no_border">
                    <TableSwitchRow
                        label="Use hyperlinks when sending fake stickers"
                        onValueChange={(v: boolean) => {
                            updateSettings({ stickerHyperLink: v });
                        }}
                        value={settings.stickerHyperLink}
                    />
                </TableRowGroup>
                <TableRowGroup title="Hide in Settings items" titleStyleType="no_border">
                    <TableSwitchRow
                        label="Hide Shop"
                        onValueChange={(v: boolean) => {
                            updateSettings({ hideCollectiblesShop: v });
                        }}
                        value={settings.hideCollectiblesShop}
                    />
                    <TableSwitchRow
                        label="Hide Quests"
                        onValueChange={(v: boolean) => {
                            updateSettings({ hideQuests: v });
                        }}
                        value={settings.hideQuests}
                    />
                    <TableSwitchRow
                        label="Hide Manage Nitro"
                        onValueChange={(v: boolean) => {
                            updateSettings({ hidePremium: v });
                        }}
                        value={settings.hidePremium}
                    />
                    <TableSwitchRow
                        label="Hide Server Boost"
                        onValueChange={(v: boolean) => {
                            updateSettings({ hidePremiumGuildBoosting: v });
                        }}
                        value={settings.hidePremiumGuildBoosting}
                    />
                    <TableSwitchRow
                        label="Hide Gifting"
                        onValueChange={(v: boolean) => {
                            updateSettings({ hidePremiumGifting: v });
                        }}
                        value={settings.hidePremiumGifting}
                    />
                    <TableSwitchRow
                        label="Hide Guild Role Subscriptions"
                        onValueChange={(v: boolean) => {
                            updateSettings({ hideGuildRoleSubscriptions: v });
                        }}
                        value={settings.hideGuildRoleSubscriptions}
                    />
                    <TableSwitchRow
                        label="Hide Premium Restore Subscription"
                        onValueChange={(v: boolean) => {
                            updateSettings({ hidePremiumRestoreSubscription: v });
                        }}
                        value={settings.hidePremiumRestoreSubscription}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
};

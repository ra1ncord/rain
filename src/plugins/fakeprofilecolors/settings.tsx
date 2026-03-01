import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import SettingsTextInput from "@api/ui/components/SettingsTextInput";
import { showToast } from "@api/ui/toasts";
import { findByProps, findByStoreName } from "@metro";
import React from "react";

import { clearColorCache, publishToRegistry, unpublishFromRegistry } from "./api";
import { useProfileColorStore } from "./storage";

const { TableRow, TableSwitchRow, TableRowGroup } = findByProps("TableRow");
const { Card } = findByProps("Card");
const { TextInput } = findByProps("TextInput");
const { View } = findByProps("View");
const UserStore = findByStoreName("UserStore");

export default function ProfileColorSettings() {
    const store = useProfileColorStore();
    const [primaryInput, setPrimaryInput] = React.useState(store.primary !== null ? `#${store.primary.toString(16)}` : "");
    const [accentInput, setAccentInput] = React.useState(store.accent !== null ? `#${store.accent.toString(16)}` : "");

    function isValidHex(hex: string) {
        return /^#?[0-9a-fA-F]{6}$/.test(hex);
    }
    function handlePrimaryChange(value: string) {
        setPrimaryInput(value);
        if (value === "") {
            store.updateSettings({ primary: null });
        } else {
            const hex = value.replace(/^#/, "");
            if (isValidHex(value)) {
                const num = parseInt(hex, 16);
                store.updateSettings({ primary: num });
            } else {
                store.updateSettings({ primary: null });
            }
        }
    }
    function handleAccentChange(value: string) {
        setAccentInput(value);
        if (value === "") {
            store.updateSettings({ accent: null });
        } else {
            const hex = value.replace(/^#/, "");
            if (isValidHex(value)) {
                const num = parseInt(hex, 16);
                store.updateSettings({ accent: num });
            } else {
                store.updateSettings({ accent: null });
            }
        }
    }

    return (
        <View style={{ flex: 1, paddingVertical: 24, paddingHorizontal: 12 }}>
            <TableRowGroup title="Settings">
                <TableSwitchRow
                    label="Enable Profile Colors"
                    value={store.enabled}
                    onValueChange={(v: boolean) => store.updateSettings({ enabled: v })}
                />
            </TableRowGroup>
            <TableRowGroup title="Colors">
                <Card style={{ marginBottom: 16, backgroundColor: semanticColors.CARD_PRIMARY_BG }}>
                    <SettingsTextInput
                        placeholder="#000000"
                        value={primaryInput}
                        onChange={handlePrimaryChange}
                        isClearable
                    />
                    <SettingsTextInput
                        placeholder="#000000"
                        value={accentInput}
                        onChange={handleAccentChange}
                        isClearable
                    />
                </Card>
            </TableRowGroup>
            <TableRowGroup>
                <TableRow
                    label="Reset Colors"
                    variant="danger"
                    arrow={false}
                    onPress={() => {
                        setPrimaryInput("");
                        setAccentInput("");
                        store.updateSettings({ primary: null, accent: null, enabled: false });
                    }}
                />
            </TableRowGroup>

            <TableRowGroup title="Other Users">
                <TableSwitchRow
                    label="Show other users' colors"
                    subLabel="Apply profile colors shared by other Rain users via the registry"
                    value={store.showOtherColors}
                    onValueChange={(v: boolean) => store.updateSettings({ showOtherColors: v })}
                />
                <TableSwitchRow
                    label="Banner color fallback"
                    subLabel="Use banner color as profile theme for non-Nitro users"
                    value={store.bannerFallback}
                    onValueChange={(v: boolean) => store.updateSettings({ bannerFallback: v })}
                />
            </TableRowGroup>

            <TableRowGroup title="Sharing">
                <TableSwitchRow
                    label="Share my profile colors"
                    subLabel="Allow other Rain users to see your custom profile colors. Your Discord ID and color values will be stored in a public registry."
                    value={store.shareColors}
                    onValueChange={(v: boolean) => {
                        store.updateSettings({ shareColors: v });
                        const myId = UserStore?.getCurrentUser?.()?.id;
                        if (!v) {
                            if (myId) {
                                unpublishFromRegistry(myId).then(ok => {
                                    if (ok) showToast("Removed from registry", findAssetId("CheckIcon"));
                                });
                            }
                        } else if (store.primary !== null && myId) {
                            publishToRegistry(myId, store.primary, store.accent ?? store.primary).then(ok => {
                                if (ok) showToast("Published colors!", findAssetId("CheckIcon"));
                                else showToast("Failed to publish", findAssetId("XIcon"));
                            });
                        }
                    }}
                />
                <TableRow
                    label="Publish Now"
                    subLabel="Manually sync your current colors to the registry"
                    trailing={<TableRow.Arrow />}
                    onPress={() => {
                        if (store.primary === null) {
                            showToast("Set a primary color first", findAssetId("XIcon"));
                            return;
                        }
                        const myId = UserStore?.getCurrentUser?.()?.id;
                        if (!myId) {
                            showToast("Not logged in", findAssetId("XIcon"));
                            return;
                        }
                        showToast("Publishing...", findAssetId("ClockIcon"));
                        publishToRegistry(myId, store.primary!, store.accent ?? store.primary!).then(ok => {
                            if (ok) {
                                store.updateSettings({ shareColors: true });
                                showToast("Published colors!", findAssetId("CheckIcon"));
                            } else {
                                showToast("Failed to publish", findAssetId("XIcon"));
                            }
                        });
                    }}
                />
                <TableRow
                    label="Clear Color Cache"
                    subLabel="Force re-fetch other users' colors from the registry"
                    trailing={<TableRow.Arrow />}
                    onPress={() => {
                        clearColorCache();
                        showToast("Color cache cleared", findAssetId("CheckIcon"));
                    }}
                />
            </TableRowGroup>
        </View>
    );
}

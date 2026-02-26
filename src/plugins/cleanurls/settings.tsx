import { ReactNative } from "@metro/common";
import { Button,Stack, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import React from "react";
import { View } from "react-native";

import { useCleanUrlsSettings } from "./storage";

export default function CleanUrlsSettings() {
    const settings = useCleanUrlsSettings();

    const openSourceUrl = () => {
        const url = ReactNative.Linking;
        if (url?.openURL) {
            url.openURL("https://gitlab.com/ClearURLs/Rules");
        }
    };

    return (
        <View>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Settings">
                    <TableSwitchRow
                        label="Remove link wrapping"
                        subLabel={settings.redirect
                            ? "https://example.com/"
                            : "https://www.google.com/url?q=https://example.com/"}
                        value={!!settings.redirect}
                        onValueChange={v => useCleanUrlsSettings.getState().updateSettings({ redirect: v })}
                    />
                    <TableSwitchRow
                        label="Remove referral parameters"
                        subLabel={`https://amazon.com/product${
                            settings.referrals ? "/" : "?tag=nexpid-50"
                        }`}
                        value={!!settings.referrals}
                        onValueChange={v => useCleanUrlsSettings.getState().updateSettings({ referrals: v })}
                    />
                </TableRowGroup>
            </Stack>
            <View style={{ marginHorizontal: 16, marginTop: 12 }}>
                <Button
                    text="Visit source"
                    onPress={openSourceUrl}
                />
            </View>
        </View>
    );
}

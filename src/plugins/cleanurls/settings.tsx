import { ReactNative } from "@metro/common";
import { Button,Stack, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import React from "react";
import { View } from "react-native";
import { useCleanUrlsSettings } from "./storage";
import { Strings } from "@rain/i18n";

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
                <TableRowGroup title={Strings.PLUGINS.CUSTOM.CLEANURLS.SETTINGS.SETTINGS}>
                    <TableSwitchRow
                        label={Strings.PLUGINS.CUSTOM.CLEANURLS.SETTINGS.REMOVE_LINK_WRAPPING}
                        subLabel={settings.redirect
                            ? "https://example.com/"
                            : "https://www.google.com/url?q=https://example.com/"}
                        value={!!settings.redirect}
                        onValueChange={v => useCleanUrlsSettings.getState().updateSettings({ redirect: v })}
                    />
                    <TableSwitchRow
                        label={Strings.PLUGINS.CUSTOM.CLEANURLS.SETTINGS.REMOVE_REF_PARAMS}
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
                    text={Strings.PLUGINS.CUSTOM.CLEANURLS.SETTINGS.VISIT_SOURCE}
                    onPress={openSourceUrl}
                />
            </View>
        </View>
    );
}

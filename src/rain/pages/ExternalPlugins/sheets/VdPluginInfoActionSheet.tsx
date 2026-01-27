import { hideSheet } from "@api/ui/sheets";
import { ActionSheet, ActionSheetRow, Button, Card, IconButton, TableRow, Text } from "@metro/common/components";
import { clipboard } from "@metro/common";
import { purgeStorage } from "@api/storage/bnstorage";
import { findAssetId } from "@api/assets";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import TitleComponent from "./TitleComponent";
import { PluginInfoActionSheetProps } from "./common";
import { semanticColors } from "@api/ui/components/color";
import { VdPluginManager } from "@rain/plugins/traveller/vendetta";
import { showConfirmationAlert } from "@api/ui/alerts";

export default function PluginInfoActionSheet({ plugin, navigation }: PluginInfoActionSheetProps) {
    plugin.usePluginState();

    const vdPlugin = VdPluginManager.plugins[plugin.id];
    const SettingsComponent = plugin.getPluginSettingsComponent();

    return <ActionSheet>
        <ScrollView>
            <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 24 }}>
                <Text variant="heading-xl/semibold">
                    {plugin.name}
                </Text>
                <View style={{ marginLeft: "auto" }}>
                    {SettingsComponent && <Button
                        size="md"
                        text="Configure"
                        variant="secondary"
                        icon={findAssetId("WrenchIcon")}
                        onPress={() => {
                            hideSheet("PluginInfoActionSheet");
                            navigation.push("PUPU_CUSTOM_PAGE", {
                                title: plugin.name,
                                render: SettingsComponent,
                            });
                        }}
                    />}
                </View>
            </View>
            <ActionSheetRow.Group>
                <ActionSheetRow
                    label={"Strings.REFETCH"}
                    icon={<TableRow.Icon source={findAssetId("RetryIcon")} />}
                    onPress={async () => {
                        if (vdPlugin.enabled) VdPluginManager.stopPlugin(plugin.id, false);

                        try {
                            await VdPluginManager.fetchPlugin(plugin.id);
                            //showToast(Strings.PLUGIN_REFETCH_SUCCESSFUL, findAssetId("toast_image_saved"));
                        } catch {
                            //showToast(Strings.PLUGIN_REFETCH_FAILED, findAssetId("Small"));
                        }

                        if (vdPlugin.enabled) await VdPluginManager.startPlugin(plugin.id);
                        hideSheet("PluginInfoActionSheet");
                    }}
                />
                <ActionSheetRow
                    label={"Strings.COPY_URL"}
                    icon={<TableRow.Icon source={findAssetId("LinkIcon")} />}
                    onPress={() => {
                        clipboard.setString(plugin.id);
                        //showToast.showCopyToClipboard();
                    }}
                />
                <ActionSheetRow
                    label={vdPlugin.update ? "Strings.DISABLE_UPDATES" : "Strings.ENABLE_UPDATES"}
                    icon={<TableRow.Icon source={findAssetId("DownloadIcon")} />}
                    onPress={() => {
                        vdPlugin.update = !vdPlugin.update;
                        //showToast(formatString("TOASTS_PLUGIN_UPDATE", {
                        //    update: vdPlugin.update,
                        //    name: plugin.name
                        //}), findAssetId("toast_image_saved"));
                    }}
                />
                <ActionSheetRow
                    label={"Strings.CLEAR_DATA"}
                    icon={<TableRow.Icon variant="danger" source={findAssetId("CopyIcon")} />}
                    variant="danger"
                    onPress={() => showConfirmationAlert({
                        title: "Strings.HOLD_UP",
                        content: "formatString(ARE_YOU_SURE_TO_CLEAR_DATA, { name: plugin.name })",
                        confirmText: "Strings.CLEAR",
                        cancelText: "Strings.CANCEL",
                        confirmColor: "red",
                        onConfirm: async () => {
                            if (vdPlugin.enabled) VdPluginManager.stopPlugin(plugin.id, false);

                            try {
                                await VdPluginManager.fetchPlugin(plugin.id);
                                //showToast(Strings.PLUGIN_REFETCH_SUCCESSFUL, findAssetId("toast_image_saved"));
                            } catch {
                                //showToast(Strings.PLUGIN_REFETCH_FAILED, findAssetId("Small"));
                            }

                            let message: any[];
                            try {
                                purgeStorage(plugin.id);
                                message = ["CLEAR_DATA_SUCCESSFUL", "trash"];
                            } catch {
                                message = ["CLEAR_DATA_FAILED", "Small"];
                            }

                            //showToast(
                            //    formatString(message[0], { name: plugin.name }),
                            //    findAssetId(message[1])
                            //);

                            if (vdPlugin.enabled) await VdPluginManager.startPlugin(plugin.id);
                            hideSheet("PluginInfoActionSheet");
                        }
                    })}
                />
                <ActionSheetRow
                    label={"Strings.DELETE"}
                    icon={<TableRow.Icon variant="danger" source={findAssetId("TrashIcon")} />}
                    variant="danger"
                    onPress={() => showConfirmationAlert({
                        title: "Strings.HOLD_UP",
                        content: "formatString(ARE_YOU_SURE_TO_DELETE_PLUGIN, { name: plugin.name })",
                        confirmText: "Strings.DELETE",
                        cancelText: "Strings.CANCEL",
                        confirmColor: "red",
                        onConfirm: () => {
                            try {
                                VdPluginManager.removePlugin(plugin.id);
                            } catch (e) {
                                //showToast(String(e), findAssetId("Small"));
                            }
                            hideSheet("PluginInfoActionSheet");
                        }
                    })}
                />
            </ActionSheetRow.Group>
        </ScrollView>
    </ActionSheet>;
}

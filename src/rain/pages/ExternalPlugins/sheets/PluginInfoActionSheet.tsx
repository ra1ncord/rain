import { hideSheet } from "@api/ui/sheets";
import { ActionSheet, Card, IconButton, Text } from "@metro/common/components";
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
import { showToast } from "@api/ui/toasts";

function PluginInfoIconButton(props) {
  const { onPress } = props;
  props.onPress &&= () => {
    hideSheet("PluginInfoActionSheet");
    onPress?.();
  };
  return <IconButton {...props} />;
}

export default function PluginInfoActionSheet({
  plugin,
  navigation,
}: PluginInfoActionSheetProps) {
  plugin.usePluginState();
  const [loading, setLoading] = useState(false);

  const isVendettaPlugin = plugin.id.includes("/");

  const copyPluginUrl = () => {
    let url = plugin.id;
    if (isVendettaPlugin) {
      url = plugin.id;
    } else {
      try {
        const pluginAny = plugin;
        const repoUrl =
        //@ts-expect-error
          pluginAny._manifest?.parentRepository ||
          //@ts-expect-error
          pluginAny.manifest?.parentRepository;
        url = repoUrl ? `${repoUrl}/builds/${plugin.id}` : plugin.id;
      } catch (e) {
        url = plugin.id;
      }
    }
    clipboard.setString(url);
    showToast("Copied to clipboard!", findAssetId("toast_copy_link"));
  };

  const refetchPlugin = async () => {
    setLoading(true);
    try {
      if (isVendettaPlugin) {
        const vdPlugin = VdPluginManager.plugins[plugin.id];
        if (vdPlugin.enabled) VdPluginManager.stopPlugin(plugin.id, false);
        await VdPluginManager.fetchPlugin(plugin.id);
        if (vdPlugin.enabled) await VdPluginManager.startPlugin(plugin.id);
        showToast("Plugin refreshed successfully");
      }
    } catch (e) {
      showToast("Failed to refresh plugin");
    } finally {
      setLoading(false);
    }
  };

  const clearPluginData = () => {
    showConfirmationAlert({
      title: "Clear Data",
      content:
        "Are you sure you want to clear all data for this plugin? This action cannot be undone.",
      confirmText: "Clear",
      confirmColor: "red",
      cancelText: "Cancel",
      onConfirm: async () => {
        hideSheet("PluginInfoActionSheet");
        try {
          if (isVendettaPlugin) {
            const vdPlugin = VdPluginManager.plugins[plugin.id];
            if (vdPlugin.enabled) VdPluginManager.stopPlugin(plugin.id, false);
            await purgeStorage(plugin.id);
            if (vdPlugin.enabled) await VdPluginManager.startPlugin(plugin.id);
          } else {
            await purgeStorage(`plugins/storage/${plugin.id}.json`);
          }
          showToast("Plugin data cleared successfully");
        } catch (e) {
          showToast("Failed to clear plugin data");
        }
      },
    });
  };

  const uninstallPluginHandler = () => {
    showConfirmationAlert({
      title: "Uninstall Plugin",
      content:
        "Are you sure you want to uninstall this plugin? This action cannot be undone.",
      confirmText: "Uninstall",
      confirmColor: "red",
      cancelText: "Cancel",
      onConfirm: async () => {
        hideSheet("PluginInfoActionSheet");
        try {
          if (isVendettaPlugin) {
            await VdPluginManager.removePlugin(plugin.id);
          }
          showToast("Plugin uninstalled successfully");
        } catch (e) {
          showToast(
            `Failed to uninstall plugin: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      },
    });
  };

  return (
    <ActionSheet>
      <ScrollView contentContainerStyle={{ gap: 12, marginBottom: 12 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingVertical: 24,
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <TitleComponent plugin={plugin} />
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 22,
            paddingHorizontal: 4,
          }}
        >
          <PluginInfoIconButton
            label="Configure"
            variant="secondary"
            disabled={!plugin.getPluginSettingsComponent()}
            icon={findAssetId("WrenchIcon")}
            onPress={() => {
              navigation.push("PUPU_CUSTOM_PAGE", {
                title: plugin.name,
                render: plugin.getPluginSettingsComponent(),
              });
            }}
          />
          <PluginInfoIconButton
            label="Refetch"
            variant="secondary"
            icon={findAssetId("RetryIcon")}
            onPress={refetchPlugin}
            disabled={loading}
          />
          <PluginInfoIconButton
            label="Copy URL"
            variant="secondary"
            icon={findAssetId("LinkIcon")}
            onPress={copyPluginUrl}
          />
          <PluginInfoIconButton
            label="Clear Data"
            variant="secondary"
            icon={findAssetId("FileIcon")}
            onPress={clearPluginData}
          />
            <PluginInfoIconButton
              label="Uninstall"
              variant="secondary"
              icon={findAssetId("TrashIcon")}
              onPress={uninstallPluginHandler}
            />
        </View>
        <Card>
          <Text
            variant="text-md/semibold"
            color="text-primary"
            style={{
              marginBottom: 4,
              color: semanticColors.HEADER_PRIMARY,
            }}
          >
            Description
          </Text>
          <Text variant="text-md/medium">{plugin.description}</Text>
        </Card>
      </ScrollView>
    </ActionSheet>
  );
}

import { useMoreCommandsSettings } from "../../storage";
import { Stack, TableRow, TableSwitchRow, TableRowGroup } from "@metro/common/components";
import { findAssetId } from "@api/assets";
import { showConfirmationAlert } from "@api/ui/alerts";
import { showToast } from "@api/ui/toasts";
import Text from "../components/Text";

export default function HiddenSettingsPage() {
  const storage = useMoreCommandsSettings();

  return (
    <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
      <Text variant="text-md/bold" color="TEXT_MUTED" align="center">
        These are hidden commands that may contain mature content or experimental features.
      </Text>
      <Text variant="text-sm/normal" color="TEXT_MUTED" align="center">
        Use at your own discretion. Commands in this section are disabled by default.
      </Text>

      <TableRowGroup title="Hidden Commands">
        <TableSwitchRow
          label="/lovefemboys"
          subLabel="Get random femboy images from r/femboys (NSFW content available)"
          icon={<TableRow.Icon source={findAssetId("HeartIcon")} />}
          value={storage.enabledCommands.lovefemboys}
          onValueChange={(v) => {
            storage.updateEnabledCommands({ lovefemboys: v });
            storage.setPendingRestart(true);
          }}
        />
      </TableRowGroup>

      <TableRowGroup title="NSFW Bypass Options">
        <TableSwitchRow
          label="KonoChan NSFW Bypass"
          subLabel="Allow NSFW KonoChan content in non-NSFW channels (USE WITH CAUTION)"
          icon={<TableRow.Icon source={findAssetId("ShieldIcon")} />}
          value={storage.hiddenSettings.konochanBypassNsfw}
          onValueChange={(v) => {
            if (v) {
              showConfirmationAlert({
                title: "NSFW Bypass Warning",
                content:
                  "Enabling this allows NSFW content from KonoChan to be sent in any channel, including non-NSFW channels. This could violate server rules or Discord ToS. Use responsibly!",
                confirmText: "I Understand",
                cancelText: "Cancel",
                onConfirm: () => {
                  storage.updateHiddenSettings({ konochanBypassNsfw: true });
                },
                onCancel: () => {},
              });
            } else {
              storage.updateHiddenSettings({ konochanBypassNsfw: false });
            }
          }}
        />
      </TableRowGroup>

      <TableRowGroup title="Hidden Settings Control">
        <TableSwitchRow
          label="Keep Hidden Settings Visible"
          subLabel="Keep this section visible even when navigating away"
          icon={<TableRow.Icon source={findAssetId("EyeIcon")} />}
          value={storage.hiddenSettings.visible}
          onValueChange={(v) => {
            storage.hiddenSettings.visible = v;
          }}
        />
        <TableRow
          label="Reset Hidden Settings"
          subLabel="Hide this section and disable all hidden commands"
          icon={<TableRow.Icon source={findAssetId("TrashIcon")} />}
          variant="danger"
          onPress={() => {
            showConfirmationAlert({
              title: "Reset Hidden Settings",
              content:
                "This will hide the hidden settings section and disable all hidden commands. Are you sure?",
              confirmText: "Reset",
              onConfirm: () => {
                storage.updateHiddenSettings({
                  enabled: false,
                  visible: false,
                  konochanBypassNsfw: false,
                });
                storage.updateEnabledCommands({ lovefemboys: false });
                storage.setPendingRestart(true);
                showToast(
                  "Hidden settings reset",
                  findAssetId("CheckmarkIcon"),
                );
              },
              cancelText: "Cancel",
            });
          }}
        />
      </TableRowGroup>
    </Stack>
  );
}

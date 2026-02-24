import { React, ReactNative } from "@metro/common";
import { TableRowGroup, TableSwitchRow, TableRow, TextInput, Stack } from "@metro/common/components";
import { semanticColors } from "@api/ui/components/color";
import { useMessageActionSheetSettings, messageActionLabels } from "../../storage";
import { findAssetId } from "@api/assets";
import { getCachedIcon } from "../../iconCache";

export default function ManageButtonsPage() {
  const settings = useMessageActionSheetSettings.getState();
  const hidden = settings.hidden ?? {};
  const update = React.useReducer(x => ~x, 0)[1];

  const setHidden = (label: string, value: boolean) => {
    const key = label.toLowerCase();
    useMessageActionSheetSettings.getState().updateSettings({
      hidden: {
        ...hidden,
        [key]: value,
      },
    });
    update();
  };

  const getIcon = (label: string) => {
    const cached = getCachedIcon(label);
    if (cached?.iconProp && React.isValidElement(cached.iconProp)) {
      return cached.iconProp as React.ReactElement;
    }
    if (cached?.source) return <TableRow.Icon source={cached.source} />;
    const key = label.toLowerCase();
    const icons: Record<string, string[]> = {
      "reply": ["ArrowAngleLeftUpIcon"],
      "message": ["ChatIcon"],
      "mention": ["AtIcon"],
      "edit message": ["PencilIcon"],
      "copy text": ["CopyIcon"],
      "copy message link": ["ic_link", "ic_link_24px"],
      "copy id": ["IdIcon"],
      "pin message": ["ic_pins"],
      "unpin message": ["ic_pins"],
      "mark unread": ["ChatMarkUnreadIcon"],
      "add reaction": ["ic_add_reaction_v2"],
      "apps": ["GameControllerIcon"],
      "create thread": ["ThreadPlusIcon"],
      "open thread": ["ThreadIcon"],
      "report": ["ic_report_message"],
      "remove embed": ["ic_hide", "ic_close"],
      "delete message": ["TrashIcon"],
      "forward": ["ArrowAngleRightUpIcon"],
      "share": ["ShareIcon"],
      "save image": ["ic_download", "ic_download_24px"],
      "save video": ["ic_download", "ic_download_24px"],
      "save sticker": ["ic_download", "ic_download_24px"],
      "download": ["ic_download", "ic_download_24px"],
    };
    const candidates = icons[key];
    if (!candidates?.length) return undefined;
    for (const assetName of candidates) {
      const assetId = findAssetId(assetName);
      if (assetId) return <TableRow.Icon source={assetId} />;
    }
    return undefined;
  };

  return (
    <ReactNative.ScrollView style={{ flex: 1, backgroundColor: semanticColors.BACKGROUND_PRIMARY }}>
      <Stack spacing={24} style={{ paddingVertical: 24, paddingHorizontal: 12 }}>
        <TableRowGroup title="Manage Buttons">
          {messageActionLabels.map(label => (
            <TableSwitchRow
              key={label}
              label={`Hide ${label}`}
              icon={getIcon(label)}
              value={!!hidden[label.toLowerCase()]}
              onValueChange={v => setHidden(label, v)}
            />
          ))}
        </TableRowGroup>
        <TableRowGroup title="Advanced">
          <TableSwitchRow
            label="Hide unknown buttons"
            subLabel="Hide action sheet rows not in the list above"
            value={!!settings.hideUnknown}
            onValueChange={v => {
              useMessageActionSheetSettings.getState().updateSettings({ hideUnknown: v });
              update();
            }}
          />
          <TextInput
            placeholder="Custom labels to hide (comma-separated)"
            value={settings.customLabels ?? ""}
            onChange={v => {
              useMessageActionSheetSettings.getState().updateSettings({ customLabels: v });
              update();
            }}
            isClearable
          />
        </TableRowGroup>
      </Stack>
    </ReactNative.ScrollView>
  );
}

import React from "react";
import { Card, Stack, TableRow, TableRowGroup, TableSwitchRow, Text, TextInput } from "@metro/common/components";
import { awaitStorage, createStorage, useObservable } from "@api/storage";
import { ReactNative } from "@metro/common";
import { View } from "react-native";
import { settings } from "@api/settings";

interface Settings {
  tapUsernameMention: boolean;
  reply: boolean;
  userEdit: boolean;
  keyboardPopup: boolean;
  delay: string;
  debugMode: boolean;
}

const taptapsettings = createStorage<Settings>("plugins/taptap.json", {
  dflt: {
    tapUsernameMention: ReactNative.Platform.select({ ios: true, android: false, default: true })!,
    reply: true,
    userEdit: true,
    keyboardPopup: true,
    delay: "300",
    debugMode: false,
  },
});

export default function TapTapSettings() {
  awaitStorage(taptapsettings);
  useObservable([taptapsettings]);

  const [delayStr, setDelayStr] = React.useState(taptapsettings.delay ?? "300");

  React.useEffect(() => {
    setDelayStr(taptapsettings.delay ?? "300");
  }, [taptapsettings.delay]);

  const applyDelay = React.useCallback((val: string) => {
    const parsed = parseInt(val, 10);
    if (!Number.isNaN(parsed)) {
      const clamped = Math.max(150, parsed);
      taptapsettings.delay = String(clamped);
    }
  }, []);

  return (
    <View>
      <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
          <TableRowGroup title={"Behavior"}>
            <TableSwitchRow
              label="Reply on double-tap"
              subLabel="Creates a pending reply when double-tapping messages"
              value={!!taptapsettings.reply}
              onValueChange={(v) => (taptapsettings.reply = v)}
            />
            <TableSwitchRow
              label="Edit own messages"
              subLabel="Double-tap your own messages to edit"
              value={!!taptapsettings.userEdit}
              onValueChange={(v) => (taptapsettings.userEdit = v)}
            />
            {ReactNative.Platform.OS === "ios" && (
            <TableSwitchRow
              label="Tap username to mention"
              subLabel="Tap a username to insert an @mention into the chat input"
              value={!!taptapsettings.tapUsernameMention}
              onValueChange={(v) => (taptapsettings.tapUsernameMention = v)}
            />
            )}
            <TableSwitchRow
              label="Open keyboard after action"
              value={!!taptapsettings.keyboardPopup}
              onValueChange={(v) => (taptapsettings.keyboardPopup = v)}
            />
          </TableRowGroup>

        <TableRowGroup title={"Timing"}>
          <TableRow
            label={
              <Text variant="text-md/semibold">Double-tap window (ms)</Text>
            }
            subLabel="Lower is faster; too low may hurt detection reliability"
            trailing={() => (
              <TextInput
                value={delayStr}
                keyboardType="numeric"
                size="md"
                style={{ minWidth: 96 }}
                onChange={(t) => setDelayStr(t)}
                onEndEditing={() => applyDelay(delayStr)}
              />
            )}
          />
        </TableRowGroup>

        {settings.developerSettings === true && (
        <TableRowGroup title={"Debug"}>
          <TableSwitchRow
            label="Debug logging"
            subLabel="Log gesture state to console"
            value={!!taptapsettings.debugMode}
            onValueChange={(v) => (taptapsettings.debugMode = v)}
          />
        </TableRowGroup>
        )}
      </Stack>
    </View>
  );
}

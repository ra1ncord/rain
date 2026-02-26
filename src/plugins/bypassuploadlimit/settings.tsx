import SettingsTextInput from "@api/ui/components/SettingsTextInput";
import { findByProps } from "@metro";
import { Stack, TableRadioGroup, TableRadioRow, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { ScrollView } from "react-native";

import { useUploaderSettings } from "./storage";

const { Card } = findByProps("Card");

const LITTERBOX_DURATIONS = [
    { label: "1 hour", value: "1" },
    { label: "12 hours", value: "12" },
    { label: "24 hours", value: "24" },
    { label: "72 hours", value: "72" },
];

export default function UploaderSettings() {
    const settings = useUploaderSettings();
    const { updateSettings } = settings;

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 12, paddingHorizontal: 12 }}>
                <TableRowGroup title="Behavior">
                    <TableSwitchRow
                        label="Always upload"
                        subLabel="Upload to the service even if under the limit"
                        value={settings.alwaysUpload}
                        onValueChange={(v: boolean) => updateSettings({ alwaysUpload: v })}
                    />
                </TableRowGroup>

                <TableRadioGroup
                    title="Upload Action"
                    value={settings.uploadAction || "clipboard"}
                    onChange={(v: string) => updateSettings({ uploadAction: v as typeof settings.uploadAction })}
                >
                    <TableRadioRow
                        label="Copy link to clipboard"
                        value="clipboard"
                    />
                    <TableRadioRow
                        label="Insert into input only"
                        value="insertonly"
                    />
                    <TableRadioRow
                        label="Insert into input and send"
                        value="insert"
                    />
                    <TableRadioRow
                        label="Send on next message"
                        value="nextmsg"
                    />
                </TableRadioGroup>

                <TableRadioGroup
                    title="File Host"
                    value={settings.selectedHost}
                    onChange={(v: string) => updateSettings({ selectedHost: v as "catbox" | "litterbox" | "uguu" })}
                >
                    <TableRadioRow
                        label="Catbox"
                        subLabel="Files are stored permanently, max 200MB"
                        value="catbox"
                    />
                    <TableRadioRow
                        label="Litterbox"
                        subLabel="Files expire after a set duration, max 1GB"
                        value="litterbox"
                    />
                    <TableRadioRow
                        label="Uguu"
                        subLabel="Files are stored temporarily, max 128MB, expires in 3h"
                        value="uguu"
                    />
                </TableRadioGroup>

                {settings.selectedHost === "litterbox" && (
                    <TableRadioGroup
                        title="Litterbox Expiry"
                        value={settings.litterboxDuration}
                        onChange={(v: string) => updateSettings({ litterboxDuration: v })}
                    >
                        {LITTERBOX_DURATIONS.map(({ label, value }) => (
                            <TableRadioRow key={value} label={label} value={value} />
                        ))}
                    </TableRadioGroup>
                )}

                <TableRowGroup title="Catbox User Hash">
                    <Card>
                        <SettingsTextInput
                            placeholder="Your Catbox user hash (optional)"
                            value={settings.userHash}
                            onChange={(v: string) => updateSettings({ userHash: v })}
                            isClearable
                        />
                    </Card>
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}

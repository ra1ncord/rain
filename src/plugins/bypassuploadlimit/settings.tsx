import SettingsTextInput from "@api/ui/components/SettingsTextInput";
import { findByProps } from "@metro";
import { Stack, TableRadioGroup, TableRadioRow, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { ScrollView } from "react-native";

import { useUploaderSettings } from "./storage";

const { Card } = findByProps("Card");

const LITTERBOX_DURATIONS = [
    { label: "1 hour", value: "1" },
    { label: "12 hours", value: "12" },
    { label: "1 day", value: "24" },
    { label: "3 days", value: "72" },
];

const ZIPLINE_DURATIONS = [
    { label: "Never (default)", value: "never" },
    { label: "1 hour", value: "1h" },
    { label: "12 hours", value: "12h" },
    { label: "1 day", value: "1d" },
    { label: "3 days", value: "3d" },
];

const ZIPLINE_FILENAMES = [
    { label: "Date (default)", value: "date" },
    { label: "Random", value: "random" },
    { label: "UUID", value: "uuid" },
    { label: "File name", value: "name" },
    { label: "Gfycat-style name", value: "gfycat" },
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
                    <TableSwitchRow
                        label="Use hyperlink"
                        subLabel="Use a markdown hyperlink so the filename is shown in chat"
                        value={settings.useHyperlink}
                        onValueChange={(v: boolean) => updateSettings({ useHyperlink: v })}
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
                    onChange={(v: string) => updateSettings({ selectedHost: v as "catbox" | "litterbox" | "uguu" | "zipline" })}
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
                    <TableRadioRow
                        label="Zipline"
                        subLabel="Self-hosted file host instance, can be stored permanently or temporarily"
                        value="zipline"
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

                {settings.selectedHost === "catbox" && (
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
                )}

                {settings.selectedHost === "zipline" && (
                    <>
                        <TableRowGroup title="Zipline Auth Settings">
                            <Stack spacing={5}>
                                <Card>
                                    <SettingsTextInput
                                        placeholder="Server URL (e.g. https://your-zipline.com)"
                                        value={settings.ziplineServerURL}
                                        onChange={(v: string) => updateSettings({ ziplineServerURL: v })}
                                        isClearable
                                    />
                                </Card>
                                <Card>
                                    <SettingsTextInput
                                        placeholder="Your Zipline Token"
                                        value={settings.ziplineUserToken}
                                        onChange={(v: string) => updateSettings({ ziplineUserToken: v })}
                                        isClearable
                                    />
                                </Card>
                            </Stack>
                        </TableRowGroup>

                        <TableRadioGroup
                            title="Zipline File Expiry"
                            value={settings.ziplineDuration}
                            onChange={(v: string) => updateSettings({ ziplineDuration: v })}
                        >
                            {ZIPLINE_DURATIONS.map(({ label, value }) => (
                                <TableRadioRow key={value} label={label} value={value} />
                            ))}
                        </TableRadioGroup>

                        <TableRadioGroup
                            title="Zipline File Name"
                            value={settings.ziplineFileNameFormat}
                            onChange={(v: string) => updateSettings({ ziplineFileNameFormat: v })}
                        >
                            {ZIPLINE_FILENAMES.map(({ label, value }) => (
                                <TableRadioRow key={value} label={label} value={value} />
                            ))}
                        </TableRadioGroup>
                    </>
                )}
            </Stack>
        </ScrollView>
    );
}

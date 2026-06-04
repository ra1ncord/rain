import SettingsTextInput from "@api/ui/components/SettingsTextInput";
import { findByProps } from "@metro";
import { Stack, TableRow, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";

import { fetchZiplinePublicDomains } from "./api/zipline";
import { useUploaderSettings } from "./storage";

const { Card } = findByProps("Card");
const { showSimpleActionSheet } = findByProps("showSimpleActionSheet");
const { hideActionSheet } = findByProps("openLazy", "hideActionSheet");

const UPLOAD_ACTIONS = [
    { label: "Copy link to clipboard", value: "clipboard" },
    { label: "Insert into input only", value: "insertonly" },
    { label: "Insert into input and send", value: "insert" },
    { label: "Send on next message", value: "nextmsg" },
];

const FILE_HOSTS = [
    { label: "Catbox", subLabel: "Files are stored permanently, max 200MB", value: "catbox" },
    { label: "Litterbox", subLabel: "Files expire after a set duration, max 1GB", value: "litterbox" },
    { label: "Uguu", subLabel: "Files are stored temporarily, max 128MB, expires in 3h", value: "uguu" },
    { label: "Zipline", subLabel: "Self-hosted file host instance", value: "zipline" },
];

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

function labelOf(options: { label: string; value: string }[], value: string): string {
    return options.find(o => o.value === value)?.label ?? value;
}

function openPicker(
    key: string,
    title: string,
    options: { label: string; value: string }[],
    current: string,
    onSelect: (v: string) => void,
) {
    showSimpleActionSheet({
        key,
        header: { title },
        options: options.map(({ label, value }) => ({
            label,
            isMarked: current === value,
            onPress: () => { onSelect(value); hideActionSheet(); },
        })),
    });
}

interface ZiplineDomainSectionProps {
    serverURL: string;
    selectedDomain: string;
    onSelectDomain: (d: string) => void;
}

function ZiplineDomainSection({ serverURL, selectedDomain, onSelectDomain }: ZiplineDomainSectionProps) {
    const [domains, setDomains] = useState<string[] | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!serverURL) {
            setDomains(null);
            return;
        }
        let cancelled = false;
        setLoading(true);
        fetchZiplinePublicDomains(serverURL).then(result => {
            if (!cancelled) {
                setDomains(result);
                setLoading(false);
            }
        });
        return () => { cancelled = true; };
    }, [serverURL]);

    if (!serverURL || (domains === null && !loading)) return null;

    if (loading) {
        return (
            <Text style={{ padding: 12, opacity: 0.5, fontSize: 13 }}>Fetching domains...</Text>
        );
    }

    if (!domains || domains.length === 0) {
        return (
            <>
                <Text style={{ paddingHorizontal: 12, paddingBottom: 8, opacity: 0.6, fontSize: 13 }}>
                    No domain overrides found on this server.
                </Text>
                <Card>
                    <SettingsTextInput
                        placeholder="Enter domain override manually (optional)"
                        value={selectedDomain}
                        onChange={onSelectDomain}
                        isClearable
                    />
                </Card>
            </>
        );
    }

    const openDomainPicker = () => {
        showSimpleActionSheet({
            key: "ZiplineDomainSelect",
            header: { title: "Select Domain" },
            options: [
                {
                    label: "Server default domain",
                    isMarked: selectedDomain === "",
                    onPress: () => { onSelectDomain(""); hideActionSheet(); },
                },
                ...domains.map(domain => ({
                    label: domain,
                    isMarked: selectedDomain === domain,
                    onPress: () => { onSelectDomain(domain); hideActionSheet(); },
                })),
            ],
        });
    };

    return (
        <TableRow
            label="Override Domain"
            subLabel={selectedDomain || "Server default domain"}
            trailing={() => <TableRow.Arrow />}
            onPress={openDomainPicker}
        />
    );
}

export default function UploaderSettings() {
    const settings = useUploaderSettings();
    const { updateSettings } = settings;

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 12, paddingHorizontal: 12 }}>
                <TableRowGroup title="Settings">
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
                    <TableRow
                        label="Upload Action"
                        subLabel={labelOf(UPLOAD_ACTIONS, settings.uploadAction || "clipboard")}
                        trailing={() => <TableRow.Arrow />}
                        onPress={() => openPicker(
                            "UploadActionSelect",
                            "Upload Action",
                            UPLOAD_ACTIONS,
                            settings.uploadAction || "clipboard",
                            v => updateSettings({ uploadAction: v as typeof settings.uploadAction }),
                        )}
                    />
                    <TableRow
                        label="File Host"
                        subLabel={labelOf(FILE_HOSTS, settings.selectedHost)}
                        trailing={() => <TableRow.Arrow />}
                        onPress={() => openPicker(
                            "FileHostSelect",
                            "File Host",
                            FILE_HOSTS,
                            settings.selectedHost,
                            v => updateSettings({ selectedHost: v as typeof settings.selectedHost }),
                        )}
                    />
                </TableRowGroup>

                {settings.selectedHost === "catbox" && (
                    <TableRowGroup title="Catbox">
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

                {settings.selectedHost === "litterbox" && (
                    <TableRowGroup title="Litterbox">
                        <TableRow
                            label="Expiry"
                            subLabel={labelOf(LITTERBOX_DURATIONS, settings.litterboxDuration)}
                            trailing={() => <TableRow.Arrow />}
                            onPress={() => openPicker(
                                "LitterboxExpirySelect",
                                "Litterbox Expiry",
                                LITTERBOX_DURATIONS,
                                settings.litterboxDuration,
                                v => updateSettings({ litterboxDuration: v }),
                            )}
                        />
                    </TableRowGroup>
                )}

                {settings.selectedHost === "zipline" && (
                    <>
                        <TableRowGroup title="Zipline Auth">
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

                        {settings.ziplineServerURL && <TableRowGroup title="Zipline Upload Settings">
                            <TableRow
                                label="File Expiry"
                                subLabel={labelOf(ZIPLINE_DURATIONS, settings.ziplineDuration)}
                                trailing={() => <TableRow.Arrow />}
                                onPress={() => openPicker(
                                    "ZiplineExpirySelect",
                                    "File Expiry",
                                    ZIPLINE_DURATIONS,
                                    settings.ziplineDuration,
                                    v => updateSettings({ ziplineDuration: v }),
                                )}
                            />
                            <TableRow
                                label="File Name Format"
                                subLabel={labelOf(ZIPLINE_FILENAMES, settings.ziplineFileNameFormat)}
                                trailing={() => <TableRow.Arrow />}
                                onPress={() => openPicker(
                                    "ZiplineFilenameSelect",
                                    "File Name Format",
                                    ZIPLINE_FILENAMES,
                                    settings.ziplineFileNameFormat,
                                    v => updateSettings({ ziplineFileNameFormat: v }),
                                )}
                            />
                            <ZiplineDomainSection
                                serverURL={settings.ziplineServerURL}
                                selectedDomain={settings.ziplineDomain}
                                onSelectDomain={(d: string) => updateSettings({ ziplineDomain: d })}
                            />
                        </TableRowGroup>}
                    </>
                )}
            </Stack>
        </ScrollView>
    );
}

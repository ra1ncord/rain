import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import { findByProps } from "@metro";
import { Stack, TableRow, TableRowGroup, TableSwitchRow, TextInput } from "@metro/common/components";
import { ScrollView, View } from "react-native";

import { type Activity, type ActivityButton,DEFAULT_APP_ID, useRichPresenceSettings } from "./storage";

const { showSimpleActionSheet } = findByProps("showSimpleActionSheet");
const { hideActionSheet } = findByProps("openLazy", "hideActionSheet");

const ACTIVITY_TYPES = [
    { label: "Playing", value: 0 },
    { label: "Streaming", value: 1 },
    { label: "Listening", value: 2 },
    { label: "Watching", value: 3 },
    { label: "Competing", value: 6 },
];

function parseDuration(input: string, now: number): number | null {
    const trimmed = input.trim();
    if (!trimmed) return null;

    const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d)?$/i);
    if (!match) return null;

    const num = parseFloat(match[1]);
    const unit = (match[2] || "ms").toLowerCase();

    const multipliers: Record<string, number> = {
        ms: 1,
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    };

    return Math.round(num * (multipliers[unit] ?? 1));
}

function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

function getStartLabel(start?: number): string {
    if (!start) return "Not set — e.g. 30m, 2h, 1d";
    const diff = Date.now() - start;
    if (diff < 0) return "In the future";
    return `Started ${formatDuration(diff)} ago`;
}

function getEndLabel(end?: number): string {
    if (!end) return "No end — e.g. 1h, 4h, 24h";
    const diff = end - Date.now();
    if (diff < 0) return "Already passed";
    return `Ends in ${formatDuration(diff)}`;
}

const InputRow = ({
    label,
    value,
    onChange,
    placeholder,
    isClearable,
    isDisabled,
    keyboardType,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    isClearable?: boolean;
    isDisabled?: boolean;
    keyboardType?: "numeric" | "email-address" | "phone-pad" | undefined;
}) => (
    <TableRow
        label={label}
        subLabel={
            <View style={{ marginTop: 8 }}>
                <TextInput
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    isClearable={isClearable}
                    isDisabled={isDisabled}
                    keyboardType={keyboardType}
                />
            </View>
        }
    />
);

function updateProfile(updates: Partial<Activity>) {
    const state = useRichPresenceSettings.getState();
    const profile = state.profiles[state.selectedProfile];
    if (!profile) return;
    useRichPresenceSettings.getState().updateSettings({
        profiles: {
            ...state.profiles,
            [state.selectedProfile]: { ...profile, ...updates },
        },
    });
}

function updateButton(index: number, updates: Partial<ActivityButton>) {
    const state = useRichPresenceSettings.getState();
    const profile = state.profiles[state.selectedProfile];
    if (!profile) return;
    const buttons = [...(profile.buttons ?? [])];
    while (buttons.length <= index) buttons.push({});
    buttons[index] = { ...buttons[index], ...updates };
    useRichPresenceSettings.getState().updateSettings({
        profiles: {
            ...state.profiles,
            [state.selectedProfile]: { ...profile, buttons },
        },
    });
}

export default function Settings() {
    const state = useRichPresenceSettings();
    const profile = state.profiles?.[state.selectedProfile] as Activity | undefined;

    if (!profile) {
        return (
            <ScrollView style={{ flex: 1 }}>
                <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                    <TableRowGroup title="Error">
                        <TableRow label="No profile selected. This should not happen." />
                    </TableRowGroup>
                </Stack>
            </ScrollView>
        );
    }

    const tsEnabled = !!profile.timestamps?._enabled;
    const currentType = ACTIVITY_TYPES.find(t => t.value === (profile.type ?? 0))?.label ?? "Playing";

    const showTypeSheet = () => {
        showSimpleActionSheet({
            key: "ActivityTypeSelect",
            header: {
                title: "Select Activity Type",
            },
            options: ACTIVITY_TYPES.map(t => ({
                label: t.label,
                isMarked: t.value === profile.type,
                onPress: () => {
                    updateProfile({ type: t.value });
                    hideActionSheet();
                },
            })),
        });
    };

    const handleStartInput = (value: string) => {
        const now = Date.now();
        const ms = parseDuration(value, now);
        if (ms !== null) {
            updateProfile({ timestamps: { ...profile.timestamps, _enabled: true, start: now - ms } });
        }
    };

    const handleEndInput = (value: string) => {
        const now = Date.now();
        const ms = parseDuration(value, now);
        if (ms !== null) {
            updateProfile({ timestamps: { ...profile.timestamps, _enabled: tsEnabled, end: now + ms } });
        }
    };

    return (
        <ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Basic">
                    <InputRow
                        label="Application Name"
                        value={profile.name}
                        onChange={(v: string) => updateProfile({ name: v })}
                        placeholder="Discord"
                    />
                    <InputRow
                        label="Application ID"
                        value={profile.application_id}
                        onChange={(v: string) => updateProfile({ application_id: v })}
                        placeholder={DEFAULT_APP_ID}
                    />
                    {profile.application_id.trim() === "" ? (
                        <TableRow
                            label="Reset to default"
                            subLabel="Restores the default Discord application ID"
                            trailing={() => <TableRow.Arrow />}
                            onPress={() => {
                                updateProfile({ application_id: DEFAULT_APP_ID });
                                showToast("Application ID reset", findAssetId("CheckmarkLargeIcon"));
                            }}
                        />
                    ) : (
                        <TableRow
                            label="Application ID hint"
                            subLabel="You can use your own bot's application ID"
                        />
                    )}
                    <InputRow
                        label="Details"
                        value={profile.details ?? ""}
                        onChange={(v: string) => updateProfile({ details: v })}
                        placeholder="Competitive"
                    />
                    <InputRow
                        label="State"
                        value={profile.state ?? ""}
                        onChange={(v: string) => updateProfile({ state: v })}
                        placeholder="Playing Solo"
                    />
                    <TableRow
                        label="Activity Type"
                        subLabel={currentType}
                        trailing={() => <TableRow.Arrow />}
                        onPress={showTypeSheet}
                        arrow
                    />
                </TableRowGroup>

                <TableRowGroup title="Images">
                    <InputRow
                        label="Large Image"
                        value={profile.assets?.large_image ?? ""}
                        onChange={(v: string) => updateProfile({ assets: { ...profile.assets, large_image: v } })}
                        placeholder="asset_key or URL"
                    />
                    <InputRow
                        label="Large Image Text"
                        value={profile.assets?.large_text ?? ""}
                        onChange={(v: string) => updateProfile({ assets: { ...profile.assets, large_text: v } })}
                        placeholder="Displayed on hover"
                        isDisabled={!profile.assets?.large_image}
                    />
                    <InputRow
                        label="Small Image"
                        value={profile.assets?.small_image ?? ""}
                        onChange={(v: string) => updateProfile({ assets: { ...profile.assets, small_image: v } })}
                        placeholder="asset_key or URL"
                    />
                    <InputRow
                        label="Small Image Text"
                        value={profile.assets?.small_text ?? ""}
                        onChange={(v: string) => updateProfile({ assets: { ...profile.assets, small_text: v } })}
                        placeholder="Displayed on hover"
                        isDisabled={!profile.assets?.small_image}
                    />
                </TableRowGroup>

                <TableRowGroup title="Timestamps">
                    <TableSwitchRow
                        label="Enable timestamps"
                        value={tsEnabled}
                        onValueChange={(v: boolean) => updateProfile({ timestamps: { ...profile.timestamps, _enabled: v } })}
                    />
                    {tsEnabled && (
                        <>
                            <InputRow
                                label="Start"
                                value=""
                                onChange={handleStartInput}
                                placeholder="e.g. 30m, 2h, 1d"
                            />
                            <InputRow
                                label="End"
                                value=""
                                onChange={handleEndInput}
                                placeholder="e.g. 1h, 4h, 24h (leave empty for no end)"
                            />
                            <TableRow
                                label="Start info"
                                subLabel={getStartLabel(profile.timestamps?.start)}
                            />
                            <TableRow
                                label="End info"
                                subLabel={getEndLabel(profile.timestamps?.end)}
                            />
                        </>
                    )}
                </TableRowGroup>

                <TableRowGroup title="Buttons">
                    <InputRow
                        label="Button 1 Label"
                        value={profile.buttons?.[0]?.label ?? ""}
                        onChange={(v: string) => updateButton(0, { label: v })}
                        placeholder="Label"
                    />
                    <InputRow
                        label="Button 1 URL"
                        value={profile.buttons?.[0]?.url ?? ""}
                        onChange={(v: string) => updateButton(0, { url: v })}
                        placeholder="https://example.com"
                        isDisabled={!profile.buttons?.[0]?.label}
                    />
                    <InputRow
                        label="Button 2 Label"
                        value={profile.buttons?.[1]?.label ?? ""}
                        onChange={(v: string) => updateButton(1, { label: v })}
                        placeholder="Label"
                    />
                    <InputRow
                        label="Button 2 URL"
                        value={profile.buttons?.[1]?.url ?? ""}
                        onChange={(v: string) => updateButton(1, { url: v })}
                        placeholder="https://example.com"
                        isDisabled={!profile.buttons?.[1]?.label}
                    />
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}

import { findAssetId } from "@api/assets";
import {
    setExternalPluginAutoUpdate,
    uninstallExternalPlugin,
    updateExternalPlugin,
    useExternalPlugins,
} from "@api/external/plugins";
import { hideSheet } from "@api/ui/sheets";
import { showToast } from "@api/ui/toasts";
import { clipboard } from "@metro/common";
import { Button, Card, Stack, TableSwitchRow, Text } from "@metro/common/components";
import * as React from "react";

export default function ExternalPluginCard({ id }: { id: string; }) {
    const p = useExternalPlugins(s => s.plugins[id]);
    const [busy, setBusy] = React.useState<"update" | "remove" | null>(null);
    const [confirmRemove, setConfirmRemove] = React.useState(false);

    if (!p) return null;

    const onUpdate = async () => {
        setBusy("update");
        try {
            const changed = await updateExternalPlugin(id);
            showToast(changed ? "Updated" : "Up to date");
        } catch (e) {
            showToast(String(e instanceof Error ? e.message : e));
        } finally {
            setBusy(null);
        }
    };

    const onRemove = async () => {
        if (!confirmRemove) return setConfirmRemove(true);
        setBusy("remove");
        try {
            await uninstallExternalPlugin(id);
            hideSheet("PluginInfoActionSheet");
        } finally {
            setBusy(null);
        }
    };

    return (
        <Card>
            <Stack spacing={10}>
                <Text variant="text-md/semibold">Source</Text>
                <Text variant="text-sm/medium" color="text-muted" numberOfLines={2}>
                    {p.source ?? "Local file"}
                </Text>
                <Text variant="text-xs/medium" color="text-muted">
                    {`${p.manifest.version ? `v${p.manifest.version} · ` : ""}${new Date(p.updatedAt).toLocaleDateString()}`}
                </Text>

                {p.source ? (
                    <TableSwitchRow
                        label="Auto-update"
                        value={p.update}
                        onValueChange={(v: boolean) => setExternalPluginAutoUpdate(id, v)}
                    />
                ) : null}

                <Stack direction="horizontal" spacing={8}>
                    {p.source ? (
                        <Button
                            size="sm"
                            variant="secondary"
                            text="Update"
                            loading={busy === "update"}
                            icon={findAssetId("RetryIcon")}
                            onPress={onUpdate}
                            grow
                        />
                    ) : null}
                    {p.source ? (
                        <Button
                            size="sm"
                            variant="secondary"
                            text="Copy Link"
                            icon={findAssetId("LinkIcon")}
                            onPress={() => {
                                clipboard.setString(p.source!);
                                showToast("Copied");
                            }}
                            grow
                        />
                    ) : null}
                    <Button
                        size="sm"
                        variant="destructive"
                        text={confirmRemove ? "Tap again" : "Uninstall"}
                        loading={busy === "remove"}
                        icon={findAssetId("TrashIcon")}
                        onPress={onRemove}
                        grow
                    />
                </Stack>
            </Stack>
        </Card>
    );
}

import SettingsTextInput from "@api/ui/components/SettingsTextInput";
import { showToast } from "@api/ui/toasts";
import { clipboard } from "@metro/common";
import { TableRow, TableRowGroup, TableSwitchRow } from "@metro/common/components";

import { volumeDebug } from ".";
import { useVolumeBoostSettings } from "./storage";

export default function VolumeSettings() {
    const s = useVolumeBoostSettings();
    const boostedCount = Object.keys(s.boosted ?? {}).length;

    return (
        <TableRowGroup title="Volume boost">
            <SettingsTextInput
                placeholder="Max %"
                value={String(s.maxPercent)}
                onChange={(v: string) => {
                    const n = parseInt(v.replace(/\D/g, ""), 10);
                    s.updateSettings({ maxPercent: Number.isFinite(n) ? n : 1000 });
                }}
                isClearable={false}
            />
            <TableSwitchRow
                label="Show %"
                value={s.showPercent}
                onValueChange={(v: boolean) => s.updateSettings({ showPercent: v })}
            />
            <TableRow
                label="Reset boosts"
                subLabel={boostedCount ? `${boostedCount} boosted` : undefined}
                onPress={() => s.updateSettings({ boosted: {} })}
            />
            <TableSwitchRow
                label="Debug"
                value={s.debugSliders}
                onValueChange={(v: boolean) => s.updateSettings({ debugSliders: v })}
            />
            <TableRow
                label="Copy debug"
                onPress={() => {
                    clipboard.setString(volumeDebug().join("\n"));
                    showToast("Copied");
                }}
            />
        </TableRowGroup>
    );
}

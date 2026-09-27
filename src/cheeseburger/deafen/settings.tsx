import SettingsTextInput from "@api/ui/components/SettingsTextInput";
import { TableRowGroup, TableSwitchRow } from "@metro/common/components";

import { useDeafenButtonSettings } from "./storage";

export default function DeafenSettings() {
    const s = useDeafenButtonSettings();

    return (
        <TableRowGroup title="Deafen button">
            <TableSwitchRow
                label="Left of camera"
                value={!s.placeAfter}
                onValueChange={(v: boolean) => s.updateSettings({ placeAfter: !v })}
            />
            <SettingsTextInput
                placeholder="Icon size"
                value={String(s.iconSize)}
                onChange={(v: string) => {
                    const n = parseInt(v.replace(/\D/g, ""), 10);
                    s.updateSettings({ iconSize: Number.isFinite(n) ? n : 26 });
                }}
                isClearable={false}
            />
        </TableRowGroup>
    );
}

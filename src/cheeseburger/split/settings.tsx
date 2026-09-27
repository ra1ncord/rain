import { showToast } from "@api/ui/toasts";
import { clipboard } from "@metro/common";
import { TableRow, TableRowGroup, TableSwitchRow } from "@metro/common/components";

import { layoutDebug } from "./layout";
import { pipDebug } from "./pip";
import { useSplitViewSettings } from "./storage";

export default function SplitSettings() {
    const s = useSplitViewSettings();

    return (
        <TableRowGroup title="Split view">
            <TableSwitchRow
                label="Show button"
                subLabel="hold it to arrange"
                value={s.showButton}
                onValueChange={(v: boolean) => s.updateSettings({ showButton: v })}
            />
            <TableRow
                label="Reset order"
                subLabel={(s.order ?? []).join(" → ")}
                onPress={() => s.updateSettings({ order: ["stream", "them", "me"] })}
            />
            <TableRow
                label="Copy debug"
                onPress={() => {
                    clipboard.setString([...layoutDebug(), ...pipDebug()].join("\n"));
                    showToast("Copied");
                }}
            />
        </TableRowGroup>
    );
}

import { showToast } from "@api/ui/toasts";
import { clipboard } from "@metro/common";
import { TableRow, TableRowGroup } from "@metro/common/components";

import { rotateDebug } from ".";

export default function RotateSettings() {
    return (
        <TableRowGroup title="Rotate">
            <TableRow
                label="Copy debug"
                onPress={() => {
                    clipboard.setString(rotateDebug().join("\n"));
                    showToast("Copied");
                }}
            />
        </TableRowGroup>
    );
}

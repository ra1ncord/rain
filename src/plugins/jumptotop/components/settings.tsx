import { Stack, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import { useJumpToTopSettings } from "../storage";

export default function Settings() {
    const settings = useJumpToTopSettings();

    return (
        <Stack
            style={{ paddingVertical: 24, paddingHorizontal: 12 }}
            spacing={24}
        >
            <TableRowGroup title={"Settings"}>
                <TableSwitchRow
                    label={"Add button to chats"}
                    subLabel={
                        "Add the JumpToTop button above the Jump to Present button in chats."
                    }
                    value={settings.jumpToPresent}
                    onValueChange={(result) => useJumpToTopSettings.getState().updateSettings({ jumpToPresent: result })}
                />
                <TableSwitchRow
                    label={"Add button to action sheets"}
                    subLabel={
                        "Add the JumpToTop button to channel and forum action sheets."
                    }
                    value={settings.actionSheets}
                    onValueChange={(result) => useJumpToTopSettings.getState().updateSettings({ actionSheets: result })}
                />
                <TableSwitchRow
                    label={"Switch back to the old colors"}
                    subLabel={
                        "Switch back to old Jump To Present button color in dark mode (grey)."
                    }
                    value={settings.oldButton}
                    onValueChange={(result) => useJumpToTopSettings.getState().updateSettings({ oldButton: result })}
                />
            </TableRowGroup>
        </Stack>
    );
}

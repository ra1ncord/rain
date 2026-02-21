import { Stack, TableRowGroup, TableSwitchRow } from "@metro/common/components";
import React from "react";
import { useExpressionUtilsSettings } from "./storage";


function ExpressionUtilsSettings() {
    const settings = useExpressionUtilsSettings();
    const [, forceUpdate] = React.useReducer(x => ~x, 0);

    return (
        <Stack style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <TableRowGroup title="Context Menu Buttons (Emojis & Stickers)">
                <TableSwitchRow
                    label="Add To Server Button (Emojis)"
                    subLabel="Show the Add To Server button for emojis"
                    value={settings.showCloneButton}
                    onValueChange={(value: boolean) => {
                        settings.updateSettings({ showCloneButton: value });
                        forceUpdate();
                    }}
                />
                <TableSwitchRow
                    label="Favorite Button (Stickers)"
                    subLabel="Show the Favorite button for stickers"
                    value={settings.showFavoriteButton}
                    onValueChange={(value: boolean) => {
                        settings.updateSettings({ showFavoriteButton: value });
                        forceUpdate();
                    }}
                />
                <TableSwitchRow
                    label="Download Button"
                    subLabel="Show the Download button"
                    value={settings.showDownloadButton}
                    onValueChange={(value: boolean) => {
                        settings.updateSettings({ showDownloadButton: value });
                        forceUpdate();
                    }}
                />
                <TableSwitchRow
                    label="Copy URL Button"
                    subLabel="Show the Copy URL button"
                    value={settings.showCopyURLButton}
                    onValueChange={(value: boolean) => {
                        settings.updateSettings({ showCopyURLButton: value });
                        forceUpdate();
                    }}
                />
                <TableSwitchRow
                    label="Copy Markdown Button"
                    subLabel="Show the Copy Markdown button"
                    value={settings.showCopyMarkdownButton}
                    onValueChange={(value: boolean) => {
                        settings.updateSettings({ showCopyMarkdownButton: value });
                        forceUpdate();
                    }}
                />
            </TableRowGroup>

            {/* Removed Download Options group as requested */}
        </Stack>
    );
}

export default ExpressionUtilsSettings;

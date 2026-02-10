import { findAssetId } from "@api/assets";
import { findByProps } from "@metro";

import showAuthModal from "./lib/showAuthModal";
import { useReviewDBSettings } from "./storage";

const { TableRow, TableSwitchRow, TableRowGroup } = findByProps("TableRow");
const { Stack } = findByProps("Stack");

export default () => {
    const reviewdbSettings = useReviewDBSettings();
    const isAuthenticated = reviewdbSettings.authToken.length !== 0;

    return (
        <Stack
            style={{ paddingVertical: 24, paddingHorizontal: 12 }}
            spacing={24}
        >
            <TableRowGroup title="Authentication">
                <TableRow
                    label="Authenticate with ReviewDB"
                    icon={<TableRow.Icon source={findAssetId("copy")} />}
                    arrow={true}
                    disabled={isAuthenticated}
                    onPress={showAuthModal}
                />
                <TableRow
                    variant={isAuthenticated ? "danger" : undefined}
                    label="Log out of ReviewDB"
                    subLabel="Note that this does not remove ReviewDB from your Authorized Apps page in Discord."
                    icon={
                        <TableRow.Icon
                            variant={isAuthenticated ? "danger" : undefined}
                            source={findAssetId("ic_leave_24px")}
                        />
                    }
                    disabled={!isAuthenticated}
                    onPress={() =>
                        useReviewDBSettings
                            .getState()
                            .updateSettings({ authToken: "" })
                    }
                />
            </TableRowGroup>
            <TableRowGroup title="Settings">
                <TableSwitchRow
                    label="Use profile-themed send button"
                    subLabel="Controls whether the review send button should attempt to match the user's profile colors."
                    icon={
                        <TableRow.Icon source={findAssetId("ic_paint_brush")} />
                    }
                    value={reviewdbSettings.useThemedSend}
                    onValueChange={(v: boolean) =>
                        useReviewDBSettings
                            .getState()
                            .updateSettings({ useThemedSend: v })
                    }
                />
            </TableRowGroup>
        </Stack>
    );
};

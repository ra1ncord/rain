import { findAssetId } from "@api/assets";
import { React } from "@metro/common";
import { Stack, TableRadioGroup, TableRadioRow, TableRow, TableRowGroup,TableSwitchRow } from "@metro/common/components";

import { useMoreCommandsSettings } from "../../storage";
import Text from "../components/Text";

export default function GaryAPIPage() {
    const storage = useMoreCommandsSettings();
    const [, forceUpdate] = React.useReducer(x => ~x, 0);

    const currentSource = storage.garySettings.imageSource;

    return (
        <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
            <Text variant="text-md/bold" color="TEXT_MUTED" align="center">
        Choose which API the /gary command should use to fetch images.
            </Text>
            <TableRowGroup title="Gary Command Settings">
                <TableSwitchRow
                    label="/gary"
                    subLabel="Send random Gary images to channel"
                    icon={<TableRow.Icon source={findAssetId("AttachmentIcon")} />}
                    value={storage.enabledCommands.gary}
                    onValueChange={v => {
                        storage.updateEnabledCommands({ gary: v });
                        storage.setPendingRestart(true);
                    }}
                />
            </TableRowGroup>

            <TableRadioGroup
                title="API Source"
                value={currentSource}
                onChange={(v: string) => {
                    storage.garySettings.imageSource = v;
                    forceUpdate();
                }}
            >
                <TableRadioRow
                    label="Gary API"
                    subLabel="Original Gary the cat images from api.garythe.cat"
                    value="gary"
                />
                <TableRadioRow
                    label="Cat API"
                    subLabel="Random cat pictures from thecatapi.com"
                    value="catapi"
                />
                <TableRadioRow
                    label="Minker API"
                    subLabel="Minky images from minky.materii.dev"
                    value="minker"
                />
                <TableRadioRow
                    label="Goober API"
                    subLabel="Goober images from api.garythe.cat/goober"
                    value="goober"
                />
            </TableRadioGroup>

            <Text variant="text-md/bold" color="TEXT_MUTED" align="center">
        Currently using: {currentSource === "gary" ? "Gary API" : currentSource === "catapi" ? "Cat API" : currentSource === "minker" ? "Minker API" : currentSource === "goober" ? "Goober API" : "Gary API"}
            </Text>
        </Stack>
    );
}

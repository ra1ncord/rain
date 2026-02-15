import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import { ReactNative as RN } from "@metro/common";
import { Stack, TableRow, TableRowGroup,TableSwitchRow } from "@metro/common/components";

import { useMoreCommandsSettings } from "../../storage";
import Text from "../components/Text";

export default function SpotifySettingsPage() {
    const storage = useMoreCommandsSettings();

    return (
        <RN.ScrollView style={{ flex: 1, backgroundColor: semanticColors.BACKGROUND_PRIMARY }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title="Spotify Commands">
                    <TableSwitchRow
                        label="/spotify track"
                        subLabel="Share your current Spotify track"
                        icon={<TableRow.Icon source={findAssetId("SpotifyNeutralIcon")} />}
                        value={storage.enabledCommands.spotifyTrack}
                        onValueChange={v => {
                            storage.updateEnabledCommands({ spotifyTrack: v });
                            storage.setPendingRestart(true);
                        }}
                    />
                    <TableSwitchRow
                        label="/spotify album"
                        subLabel="Share your current track's album"
                        icon={<TableRow.Icon source={findAssetId("SpotifyNeutralIcon")} />}
                        value={storage.enabledCommands.spotifyAlbum}
                        onValueChange={v => {
                            storage.updateEnabledCommands({ spotifyAlbum: v });
                            storage.setPendingRestart(true);
                        }}
                    />
                    <TableSwitchRow
                        label="/spotify artists"
                        subLabel="Share your current track's artists"
                        icon={<TableRow.Icon source={findAssetId("SpotifyNeutralIcon")} />}
                        value={storage.enabledCommands.spotifyArtists}
                        onValueChange={v => {
                            storage.updateEnabledCommands({ spotifyArtists: v });
                            storage.setPendingRestart(true);
                        }}
                    />
                    <TableSwitchRow
                        label="/spotify cover"
                        subLabel="Share your current track's cover"
                        icon={<TableRow.Icon source={findAssetId("SpotifyNeutralIcon")} />}
                        value={storage.enabledCommands.spotifyCover}
                        onValueChange={v => {
                            storage.updateEnabledCommands({ spotifyCover: v });
                            storage.setPendingRestart(true);
                        }}
                    />
                </TableRowGroup>

                <Text variant="text-sm/normal" color="TEXT_MUTED" align="center">
          These commands allow you to share your current Spotify activity in Discord. Make sure you have Spotify connected to Discord for these commands to work properly.
                </Text>
            </Stack>
        </RN.ScrollView>
    );
}

import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import { findByProps } from "@metro";

import { clearTrackCache } from "../api";
import { useSongSpotlightSettings } from "../storage";

const { ScrollView } = findByProps("ScrollView");
const {
    TableSwitchRow,
    TableRowGroup,
    TableRow,
    TableRadioRow,
    TableRadioGroup,
    Stack,
} = findByProps(
    "TableSwitchRow",
    "TableRowGroup",
    "Stack",
    "TableRow",
    "TableRadioRow",
    "TableRadioGroup",
);
const { TextInput } = findByProps("TextInput");

export default function DisplaySettingsPage() {
    const settings = useSongSpotlightSettings();

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10 }}>
            <Stack spacing={8}>
                <TableRowGroup title="Track Display">
                    <TableSwitchRow
                        label="Show album art"
                        subLabel="Display album artwork thumbnails"
                        onValueChange={(value: boolean) =>
                            settings.updateSettings({ showAlbumArt: value })
                        }
                        value={settings.showAlbumArt}
                    />
                    <TableSwitchRow
                        label="Show play count"
                        subLabel="Display number of plays next to tracks"
                        onValueChange={(value: boolean) =>
                            settings.updateSettings({ showPlayCount: value })
                        }
                        value={settings.showPlayCount}
                    />
                    <TableSwitchRow
                        label="Show album name"
                        subLabel="Display the album name under each track"
                        onValueChange={(value: boolean) =>
                            settings.updateSettings({ showAlbumName: value })
                        }
                        value={settings.showAlbumName}
                    />
                    <TableSwitchRow
                        label="Colorful cards"
                        subLabel="Use blurred album art as the background for each track row"
                        onValueChange={(value: boolean) =>
                            settings.updateSettings({ colorfulCards: value })
                        }
                        value={settings.colorfulCards}
                    />
                </TableRowGroup>

                <TableRowGroup title="Section Position">
                    <TableRadioGroup
                        title="Where to show Song Spotlight"
                        value={settings.displayPosition}
                        onChange={(value: string) =>
                            settings.updateSettings({ displayPosition: value as "aboveReviewDB" | "betweenBioAndRoles" })
                        }
                    >
                        <TableRadioRow label="Below Connections (default)" value="aboveReviewDB" />
                        <TableRadioRow label="Between Bio and Roles" value="betweenBioAndRoles" />
                    </TableRadioGroup>
                </TableRowGroup>

                <TableRowGroup title="Visibility">
                    <TableSwitchRow
                        label="Show on own profile"
                        onValueChange={(value: boolean) =>
                            settings.updateSettings({ showOnOwnProfile: value })
                        }
                        value={settings.showOnOwnProfile}
                    />
                    <TableSwitchRow
                        label="Show on other profiles"
                        subLabel="Show stats for users who shared their Last.fm via the registry or have a last.fm link in their bio"
                        onValueChange={(value: boolean) =>
                            settings.updateSettings({ showOnOtherProfiles: value })
                        }
                        value={settings.showOnOtherProfiles}
                    />
                </TableRowGroup>

                <TableRowGroup title="Last.fm Header">
                    <TableSwitchRow
                        label="Show Last.fm profile header"
                        subLabel="Display Last.fm profiles as headers"
                        onValueChange={(value: boolean) =>
                            settings.updateSettings({ showLastFmHeader: value })
                        }
                        value={settings.showLastFmHeader}
                    />
                </TableRowGroup>

                {settings.showLastFmHeader && (
                    <TableRadioGroup
                        title="Header Size"
                        value={settings.headerSize}
                        onChange={(value: string) =>
                            settings.updateSettings({ headerSize: value as "small" | "medium" | "big" })
                        }
                    >
                        <TableRadioRow label="Small" value="small" />
                        <TableRadioRow label="Medium" value="medium" />
                        <TableRadioRow label="Big" value="big" />
                    </TableRadioGroup>
                )}

                <TableRowGroup title="Advanced">
                    <TableSwitchRow
                        label="Show rank numbers"
                        subLabel="Display 1, 2, 3... on each track row"
                        onValueChange={(value: boolean) =>
                            settings.updateSettings({ showRankNumbers: value })
                        }
                        value={settings.showRankNumbers}
                    />
                    <TableRow
                        label="Clear Track Cache"
                        subLabel="Force refresh track data on next profile view"
                        trailing={<TableRow.Arrow />}
                        onPress={() => {
                            clearTrackCache();
                            showToast("Track cache cleared", findAssetId("CheckIcon"));
                        }}
                    />
                </TableRowGroup>

                <TableRowGroup>
                    <Stack spacing={4}>
                        <TextInput
                            placeholder="Section Title (default: Song Spotlight)"
                            value={settings.sectionTitle}
                            onChange={(v: string) =>
                                settings.updateSettings({ sectionTitle: v })
                            }
                            isClearable
                        />
                        <TextInput
                            placeholder="Card Opacity % (default: 40)"
                            value={settings.cardOpacity === 40 ? "" : String(settings.cardOpacity)}
                            onChange={(v: string) => {
                                if (v === "") {
                                    settings.updateSettings({ cardOpacity: 40 });
                                    return;
                                }
                                const num = parseInt(v);
                                if (!isNaN(num) && num >= 0 && num <= 100) {
                                    settings.updateSettings({ cardOpacity: num });
                                }
                            }}
                            isClearable
                        />
                    </Stack>
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}

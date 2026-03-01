import { ErrorBoundary } from "@api/ui/components";
import { semanticColors } from "@api/ui/components/color";
import { createStyles } from "@api/ui/styles";
import { findByName, findByProps, findByStoreName } from "@metro";
import { ReactNative as RN } from "@metro/common";
import { PressableScale, Text } from "@metro/common/components";

import { fetchLastFmUserInfo, fetchRecentTracks, fetchTopTracks, hasCredentials, LastFmUserInfo, resolveLastFmUsername } from "../api";
import { useSongSpotlightSettings } from "../storage";
import { TopTrack } from "../types";
import SongRow from "./SongRow";

const UserStore = findByStoreName("UserStore");
const UserProfileCard = findByName("UserProfileCard");
const { getDisplayProfile } = findByProps("getDisplayProfile");

interface SongSectionProps {
    userId: string;
}

export default function SongSection({ userId }: SongSectionProps) {
    const settings = useSongSpotlightSettings();
    const [tracks, setTracks] = React.useState<TopTrack[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [lastFmUsername, setLastFmUsername] = React.useState<string | null>(null);
    const [resolving, setResolving] = React.useState(true);
    const [userInfo, setUserInfo] = React.useState<LastFmUserInfo | null>(null);

    const isOwnProfile = userId === UserStore.getCurrentUser()?.id;

    const displayProfile = getDisplayProfile?.(userId);
    const themeColors = displayProfile?.themeColors;
    const hasThemeColors = themeColors !== undefined;
    const bio = displayProfile?.bio ?? null;

    const headerSizes = {
        small:  { avatar: 24, radius: 12, textVariant: "text-xs/semibold" as const, arrowVariant: "text-xs/normal" as const, padding: 8 },
        medium: { avatar: 32, radius: 16, textVariant: "text-sm/semibold" as const, arrowVariant: "text-sm/normal" as const, padding: 10 },
        big:    { avatar: 44, radius: 22, textVariant: "text-md/semibold" as const, arrowVariant: "text-md/normal" as const, padding: 12 },
    };
    const hSize = headerSizes[settings.headerSize] || headerSizes.small;

    const useStyles = createStyles({
        card: {
            backgroundColor: hasThemeColors
                ? "#00000073"
                : semanticColors.CARD_PRIMARY_BG,
            borderRadius: 16,
            padding: 8,
        },
        trackCard: {
            backgroundColor: hasThemeColors
                ? "#00000083"
                : semanticColors.CARD_SECONDARY_BG,
        },
        emptyText: {
            textAlign: "center" as const,
            paddingVertical: 16,
            color: hasThemeColors ? "#FFFFFFB3" : semanticColors.TEXT_MUTED,
        },
        headerRow: {
            flexDirection: "row" as const,
            alignItems: "center" as const,
            paddingHorizontal: 4,
            paddingBottom: hSize.padding,
        },
        headerAvatar: {
            width: hSize.avatar,
            height: hSize.avatar,
            borderRadius: hSize.radius,
            marginRight: 8,
            backgroundColor: hasThemeColors ? "#FFFFFF1A" : semanticColors.BACKGROUND_TERTIARY,
        },
        headerText: {
            color: hasThemeColors ? "#FFFFFFB3" : semanticColors.TEXT_MUTED,
        },
    });

    const styles = useStyles();

    const sectionTitle = settings.sectionTitle?.trim() || "Song Spotlight";

    // Resolve Last.fm username for this user (async: checks cloud + bio)
    React.useEffect(() => {
        setResolving(true);
        resolveLastFmUsername(userId, isOwnProfile, bio)
            .then(username => {
                setLastFmUsername(username);
                setResolving(false);
            })
            .catch(() => {
                setLastFmUsername(null);
                setResolving(false);
            });
    }, [userId, isOwnProfile, bio]);

    // Fetch Last.fm user info for header
    React.useEffect(() => {
        if (!lastFmUsername || !settings.showLastFmHeader) {
            setUserInfo(null);
            return;
        }
        fetchLastFmUserInfo(lastFmUsername)
            .then(info => setUserInfo(info))
            .catch(() => setUserInfo(null));
    }, [lastFmUsername, settings.showLastFmHeader]);

    React.useEffect(() => {
        if (resolving) return;

        if (!hasCredentials()) {
            setLoading(false);
            setError(null);
            return;
        }

        if (isOwnProfile && !settings.showOnOwnProfile) {
            setLoading(false);
            return;
        }

        if (!isOwnProfile && !settings.showOnOtherProfiles) {
            setLoading(false);
            return;
        }

        if (!lastFmUsername) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const fetchFn = settings.displayMode === "recent"
            ? fetchRecentTracks(lastFmUsername, settings.trackCount)
            : fetchTopTracks(lastFmUsername, settings.period, settings.trackCount);

        fetchFn
            .then(result => {
                setTracks(result);
                setLoading(false);
            })
            .catch(e => {
                setError(e.message || "Failed to fetch tracks");
                setLoading(false);
            });
    }, [resolving, lastFmUsername, settings.period, settings.trackCount, settings.displayMode, settings.showOnOwnProfile, settings.showOnOtherProfiles]);

    // Don't render if no API key configured at all
    if (!hasCredentials()) return null;
    // Still resolving username — don't render yet
    if (resolving) return null;
    // No Last.fm username resolved for this user
    if (!lastFmUsername) return null;
    if (isOwnProfile && !settings.showOnOwnProfile) return null;
    if (!isOwnProfile && !settings.showOnOtherProfiles) return null;

    const handleHeaderPress = () => {
        const url = userInfo?.url || `https://www.last.fm/user/${lastFmUsername}`;
        RN.Linking.openURL(url);
    };

    return (
        <ErrorBoundary>
            <RN.View style={[styles.card]}>
                <UserProfileCard title={sectionTitle} styles={[styles.card]}>
                    {settings.showLastFmHeader && lastFmUsername && (
                        <PressableScale onPress={handleHeaderPress}>
                            <RN.View style={styles.headerRow}>
                                {userInfo?.avatar ? (
                                    <RN.Image
                                        source={{ uri: userInfo.avatar }}
                                        style={styles.headerAvatar}
                                    />
                                ) : (
                                    <RN.View style={styles.headerAvatar} />
                                )}
                                <Text variant={hSize.textVariant} style={styles.headerText}>
                                    {userInfo?.name || lastFmUsername}
                                </Text>
                                <Text variant={hSize.arrowVariant} style={[styles.headerText, { marginLeft: 4 }]}>
                                    ↗
                                </Text>
                            </RN.View>
                        </PressableScale>
                    )}

                    {loading ? (
                        <RN.ActivityIndicator
                            size="small"
                            style={{ paddingVertical: 20 }}
                        />
                    ) : error ? (
                        <Text
                            variant="text-sm/medium"
                            style={styles.emptyText}
                        >
                            {error}
                        </Text>
                    ) : tracks.length === 0 ? (
                        <Text
                            variant="text-sm/medium"
                            style={styles.emptyText}
                        >
                            {settings.displayMode === "recent" ? "No recent tracks" : "No top tracks found"}
                        </Text>
                    ) : (
                        <RN.View>
                            {tracks.map((track, index) => (
                                <React.Fragment key={`${track.rank}-${track.name}`}>
                                    {index > 0 && <RN.View style={{ height: 6 }} />}
                                    <SongRow
                                        track={track}
                                        style={styles.trackCard}
                                        showAlbumArt={settings.showAlbumArt}
                                        showPlayCount={settings.showPlayCount}
                                        showAlbumName={settings.showAlbumName}
                                        showRankNumbers={settings.showRankNumbers}
                                        hasThemeColors={hasThemeColors}
                                        colorfulCards={settings.colorfulCards}
                                        cardOpacity={settings.cardOpacity}
                                    />
                                </React.Fragment>
                            ))}
                        </RN.View>
                    )}
                </UserProfileCard>
            </RN.View>
        </ErrorBoundary>
    );
}

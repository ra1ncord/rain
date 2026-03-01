import { semanticColors } from "@api/ui/components/color";
import { createStyles } from "@api/ui/styles";
import { ReactNative as RN } from "@metro/common";
import { PressableScale, Text } from "@metro/common/components";

import { TopTrack } from "../types";

interface SongRowProps {
    track: TopTrack;
    style?: any;
    showAlbumArt: boolean;
    showPlayCount: boolean;
    showAlbumName?: boolean;
    showRankNumbers?: boolean;
    hasThemeColors?: boolean;
    colorfulCards?: boolean;
    cardOpacity?: number;
}

/** Swap the iTunes art URL to a tiny version for the blur source. */
function getBlurSource(artUrl: string): string {
    return artUrl.replace(/\d+x\d+/, "100x100");
}

export default function SongRow({ track, style, showAlbumArt, showPlayCount, showAlbumName = true, showRankNumbers = true, hasThemeColors, colorfulCards, cardOpacity = 40 }: SongRowProps) {
    const showBlur = colorfulCards && !!track.albumArt;
    const overlayOpacity = cardOpacity / 100;

    const useStyles = createStyles({
        outerClip: {
            borderRadius: 8,
            overflow: "hidden" as const,
        },
        container: {
            flexDirection: "row" as const,
            alignItems: "center" as const,
            padding: 8,
        },
        blurBackground: {
            position: "absolute" as const,
            top: -20,
            left: -20,
            right: -20,
            bottom: -20,
        },
        blurOverlay: {
            ...RN.StyleSheet.absoluteFillObject,
            backgroundColor: hasThemeColors
                ? `rgba(0,0,0,${Math.min(overlayOpacity + 0.05, 1)})`
                : `rgba(0,0,0,${overlayOpacity})`,
        },
        rankContainer: {
            width: 24,
            alignItems: "center" as const,
            justifyContent: "center" as const,
        },
        rankText: {
            color: showBlur || hasThemeColors ? "#FFFFFFB3" : semanticColors.TEXT_MUTED,
        },
        thumbnail: {
            width: 44,
            height: 44,
            borderRadius: 6,
            backgroundColor: showBlur || hasThemeColors ? "#FFFFFF1A" : semanticColors.BACKGROUND_TERTIARY,
        },
        infoContainer: {
            flex: 1,
            marginLeft: 10,
            justifyContent: "center" as const,
        },
        trackName: {
            color: showBlur || hasThemeColors ? "#FFFFFF" : semanticColors.TEXT_NORMAL,
        },
        subText: {
            color: showBlur || hasThemeColors ? "#FFFFFFB3" : semanticColors.TEXT_MUTED,
        },
        albumSubText: {
            color: showBlur || hasThemeColors ? "#FFFFFF60" : semanticColors.TEXT_MUTED,
            opacity: 0.7,
        },
        playCountContainer: {
            flexDirection: "row" as const,
            alignItems: "center" as const,
            marginTop: 2,
        },
    });

    const styles = useStyles();

    const handlePress = () => {
        if (track.url) {
            RN.Linking.openURL(track.url);
        }
    };

    return (
        <PressableScale onPress={handlePress}>
            <RN.View style={[styles.outerClip, style, showBlur && { backgroundColor: "transparent" }]}>
                {showBlur && (
                    <>
                        <RN.Image
                            source={{ uri: getBlurSource(track.albumArt!) }}
                            style={styles.blurBackground}
                            blurRadius={30}
                            resizeMode="cover"
                        />
                        <RN.View style={styles.blurOverlay} />
                    </>
                )}

                <RN.View style={styles.container}>
                    {showRankNumbers && (
                        <RN.View style={styles.rankContainer}>
                            <Text
                                variant="text-md/bold"
                                style={styles.rankText}
                            >
                                {track.rank}
                            </Text>
                        </RN.View>
                    )}

                    {showAlbumArt && (
                        track.albumArt ? (
                            <RN.Image
                                source={{ uri: track.albumArt }}
                                style={styles.thumbnail}
                            />
                        ) : (
                            <RN.View style={styles.thumbnail}>
                                <RN.View style={{
                                    flex: 1,
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}>
                                    <Text variant="text-lg/bold" style={styles.rankText}>
                                    ♪
                                    </Text>
                                </RN.View>
                            </RN.View>
                        )
                    )}

                    <RN.View style={styles.infoContainer}>
                        <Text
                            variant="text-sm/semibold"
                            style={styles.trackName}
                            numberOfLines={1}
                        >
                            {track.name}
                        </Text>
                        <RN.View style={styles.playCountContainer}>
                            <Text
                                variant="text-xs/normal"
                                style={styles.subText}
                                numberOfLines={1}
                            >
                                {track.artist}
                                {showPlayCount && track.playCount > 0
                                    ? ` · ${track.playCount.toLocaleString()} plays`
                                    : ""}
                                {showAlbumName && track.album
                                    ? <Text variant="text-xs/normal" style={styles.albumSubText}>{` · ${track.album}`}</Text>
                                    : null}
                            </Text>
                        </RN.View>
                    </RN.View>
                </RN.View>
            </RN.View>
        </PressableScale>
    );
}

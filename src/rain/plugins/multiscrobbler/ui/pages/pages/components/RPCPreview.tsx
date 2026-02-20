import { logger } from "@lib/utils/logger";
import { React, ReactNative as RN } from "@metro/common";

import { useMultiScrobblerSettings } from "../../../../storage";

export default function RPCPreview() {
    const settings = useMultiScrobblerSettings();
    const [previewTrack, setPreviewTrack] = React.useState<any>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [currentProgress, setCurrentProgress] = React.useState(0);

    const fallbackTrack = {
        name: "Bohemian Rhapsody",
        artist: "Queen",
        artists: ["Queen"],
        album: "A Night at the Opera",
        image: null,
        nowPlaying: true,
        duration: 354,
        startTime: Math.floor(Date.now() / 1000) - 120,
    };

    const parseArtists = (artistData: any): string[] => {
        if (!artistData) return ["Unknown Artist"];
        if (Array.isArray(artistData)) {
            return artistData.filter(a => a && typeof a === "string");
        }
        if (artistData["#text"]) {
            const artistText = artistData["#text"];
            return artistText
                .split(/[,;&]/)
                .map((artist: string) => artist.trim())
                .filter((artist: string) => artist.length > 0);
        }
        if (typeof artistData === "string") {
            return artistData
                .split(/[,;&]/)
                .map((artist: string) => artist.trim())
                .filter((artist: string) => artist.length > 0);
        }
        return ["Unknown Artist"];
    };

    const formatArtists = (artists: string[]): string => {
        if (!artists || artists.length === 0) return "Unknown Artist";
        if (artists.length === 1) return artists[0];
        if (artists.length === 2) return `${artists[0]} & ${artists[1]}`;
        return `${artists.slice(0, -1).join(", ")} & ${artists[artists.length - 1]}`;
    };

    React.useEffect(() => {
        const fetchPreviewData = () => {
            if (!settings.username || !settings.apiKey) {
                setPreviewTrack(fallbackTrack);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            fetch(
                `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${settings.username}&api_key=${settings.apiKey}&format=json&limit=1`,
            )
                .then(res => res.json())
                .then(data => {
                    if (
                        data.recenttracks &&
                        data.recenttracks.track &&
                        data.recenttracks.track.length > 0
                    ) {
                        const track = data.recenttracks.track[0];
                        const artists = parseArtists(track.artist);

                        let duration = 180;
                        const primaryArtist = artists[0] || "Unknown Artist";
                        fetch(
                            `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${settings.apiKey}&artist=${encodeURIComponent(primaryArtist)}&track=${encodeURIComponent(track.name)}&format=json`,
                        )
                            .then(res => res.json())
                            .then(trackInfo => {
                                if (trackInfo.track && trackInfo.track.duration) {
                                    duration = Math.floor(trackInfo.track.duration / 1000);
                                }
                            })
                            .catch(() => {
                                logger.verbose("Could not fetch track duration, using default");
                            })
                            .finally(() => {
                                setPreviewTrack({
                                    name: track.name || "Unknown Track",
                                    artist: formatArtists(artists),
                                    artists: artists,
                                    album: track.album?.["#text"] || "Unknown Album",
                                    image:
                                        track.image?.[2]?.["#text"] ||
                                        track.image?.[1]?.["#text"] ||
                                        null,
                                    nowPlaying: track["@attr"]?.nowplaying === "true",
                                    duration: duration,
                                    startTime:
                                        track["@attr"]?.nowplaying === "true"
                                            ? Math.floor(Date.now() / 1000) - 60
                                            : null,
                                });
                                setIsLoading(false);
                            });
                    } else {
                        setPreviewTrack(fallbackTrack);
                        setIsLoading(false);
                    }
                })
                .catch(() => {
                    setPreviewTrack(fallbackTrack);
                    setIsLoading(false);
                });
        };

        fetchPreviewData();
    }, [settings.username, settings.apiKey]);

    React.useEffect(() => {
        if (!previewTrack?.nowPlaying || !settings.showTimestamp) {
            return;
        }

        const interval = setInterval(() => {
            if (previewTrack.startTime && previewTrack.duration) {
                const now = Math.floor(Date.now() / 1000);
                const elapsed = now - previewTrack.startTime;
                const progress = Math.min(elapsed / previewTrack.duration, 1);
                setCurrentProgress(progress);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [previewTrack, settings.showTimestamp]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const getPreviewText = () => {
        let text = "";

        if (settings.showAlbumInTooltip && previewTrack?.album) {
            text += `on ${previewTrack.album}`;
        }

        if (settings.showDurationInTooltip && previewTrack?.duration) {
            const durationText = ` • ${formatTime(previewTrack.duration)}`;
            if (text) {
                text += durationText;
            } else {
                text = formatTime(previewTrack.duration);
            }
        }

        return text || "No tooltip text";
    };

    const getCurrentProgressData = () => {
        if (!previewTrack?.duration) return { current: 0, total: 0, progress: 0 };

        if (previewTrack.nowPlaying) {
            const current = currentProgress * previewTrack.duration;
            return {
                current,
                total: previewTrack.duration,
                progress: currentProgress,
            };
        } else {
            return {
                current: previewTrack.duration * 0.3,
                total: previewTrack.duration,
                progress: 0.3,
            };
        }
    };

    const activityType = settings.listeningTo ? "Listening to" : "Playing";
    const appName = settings.appName || "Music";
    const showLargeText = settings.showLargeText;
    const showTimestamp = settings.showTimestamp;

    if (isLoading) {
        return (
            <RN.View style={styles.container}>
                <RN.View style={styles.loadingContent}>
                    <RN.View style={styles.loadingSpinner} />
                    <RN.Text style={styles.loadingText}>Loading preview...</RN.Text>
                </RN.View>
            </RN.View>
        );
    }

    if (!previewTrack) {
        return (
            <RN.View style={styles.container}>
                <RN.Text style={styles.centeredText}>Unable to load preview</RN.Text>
            </RN.View>
        );
    }

    const progressData = getCurrentProgressData();
    const previewText = getPreviewText();

    return (
        <RN.View style={styles.previewContainer}>
            <RN.View style={styles.header}>
                <RN.Text style={styles.activityType}>
                    {activityType} {appName}
                </RN.Text>
                <RN.Text style={styles.rpcPreviewText} numberOfLines={1}>
                    RPC Preview
                </RN.Text>
            </RN.View>

            <RN.View style={styles.content}>
                <RN.View style={styles.albumArt}>
                    {previewTrack.image ? (
                        <RN.Image
                            source={{ uri: previewTrack.image }}
                            style={styles.albumImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <RN.Text style={styles.musicIcon}>🎵</RN.Text>
                    )}
                </RN.View>

                <RN.View style={styles.trackInfo}>
                    <RN.Text style={styles.trackName} numberOfLines={1}>
                        {previewTrack.name}
                    </RN.Text>
                    <RN.Text style={styles.artistName} numberOfLines={1}>
                        {previewTrack.artist}
                    </RN.Text>
                    {showLargeText && previewText !== "No tooltip text" && (
                        <RN.Text style={styles.tooltipText} numberOfLines={1}>
                            {previewText}
                        </RN.Text>
                    )}

                    {showTimestamp && previewTrack.duration ? (
                        <RN.View style={styles.progressContainer}>
                            <RN.Text style={styles.timeText}>
                                {formatTime(progressData.current)}
                            </RN.Text>
                            <RN.View style={styles.progressBar}>
                                <RN.View
                                    style={[
                                        styles.progressFill,
                                        { width: `${progressData.progress * 100}%` },
                                    ]}
                                />
                            </RN.View>
                            <RN.Text style={styles.timeText}>
                                {formatTime(progressData.total)}
                            </RN.Text>
                        </RN.View>
                    ) : null}
                </RN.View>
            </RN.View>
        </RN.View>
    );
}

const styles = RN.StyleSheet.create({
    container: {
        backgroundColor: "#1e1f22",
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#3a3c41",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 120,
    },
    loadingContent: {
        alignItems: "center",
        justifyContent: "center",
    },
    loadingSpinner: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#5865f2",
        borderTopColor: "transparent",
        marginBottom: 8,
    },
    previewContainer: {
        backgroundColor: "#1e1f22",
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#3a3c41",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
        gap: 8,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
    },
    albumArt: {
        width: 80,
        height: 80,
        backgroundColor: "#2b2d31",
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
        borderWidth: 1,
        borderColor: "#40444b",
        overflow: "hidden",
        flexShrink: 0,
    },
    trackInfo: {
        flex: 1,
        minWidth: 0,
    },
    progressContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 6,
    },
    progressBar: {
        flex: 1,
        height: 2,
        backgroundColor: "#2b2d31",
        borderRadius: 3,
        overflow: "hidden",
    },
    progressFill: {
        height: 2,
        backgroundColor: "#5865f2",
        borderRadius: 3,
    },
    loadingText: {
        color: "#949ba4",
        fontSize: 14,
        fontWeight: "500",
    },
    centeredText: {
        color: "#949ba4",
        fontSize: 14,
        fontWeight: "500",
        textAlign: "center",
    },
    activityType: {
        color: "#dbdee1",
        fontSize: 14,
        fontWeight: "600",
        flex: 1,
    },
    rpcPreviewText: {
        color: "#80848e",
        fontSize: 12,
        fontStyle: "italic",
        flexShrink: 0,
    },
    albumImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
    },
    musicIcon: {
        color: "#80848e",
        fontSize: 32,
    },
    trackName: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 4,
    },
    artistName: {
        color: "#b5bac1",
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 4,
    },
    tooltipText: {
        color: "#80848e",
        fontSize: 12,
        fontStyle: "italic",
        marginBottom: 6,
    },
    timeText: {
        color: "#80848e",
        fontSize: 11,
        fontWeight: "500",
        minWidth: 35,
        textAlign: "center",
    },
});

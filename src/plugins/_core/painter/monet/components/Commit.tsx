import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import { createStyles } from "@api/ui/styles";
import { ReactNative as RN } from "@metro/common";
import { PressableScale, Stack, Text } from "@metro/common/components";

import { conventionalCommitRegex, parseConventionalCommit } from "../stuff/conventionalCommits";
import { getDiscordTheme } from "../stuff/buildTheme";

export interface CommitUser {
    login: string;
    id: number;
    avatar_url: string;
    type: string;
}

export interface CommitObj {
    sha: string;
    commit: {
        author: { name: string; email: string; date: string };
        committer: { name: string; email: string; date: string };
        message: string;
    };
    html_url: string;
    author?: CommitUser;
    committer?: CommitUser;
    parents: { sha: string; url: string; html_url: string }[];
}

export enum CommitState {
    Selected = 0,
    Default = 1,
}

const conventionalCommitLabelColors: Record<string, number[]> = {
    feat: [162, 238, 239, 180, 70, 78],
    fix: [215, 58, 74, 353, 66, 53],
    docs: [0, 117, 202, 205, 100, 39],
    build: [217, 63, 11, 15, 90, 44],
    refactor: [0, 107, 117, 185, 100, 22],
    test: [251, 202, 4, 48, 96, 50],
    ci: [197, 222, 245, 208, 70, 86],
    perf: [83, 25, 231, 256, 81, 50],
};

const useStyles = createStyles({
    card: {
        padding: 16,
        borderRadius: 16,
        borderColor: semanticColors.BORDER_MUTED,
        borderWidth: 1,
        backgroundColor: semanticColors.CARD_PRIMARY_BG,
        marginHorizontal: 16,
    },
    cardSelected: {
        borderColor: semanticColors.TEXT_BRAND,
    },
    cardDefault: {
        borderColor: "#fffa",
    },
    title: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: 6,
    },
    avatar: {
        width: 18,
        height: 18,
        borderRadius: 11,
    },
    labelTitle: {
        transform: [{ translateY: -2 }],
    },
    label: {
        paddingHorizontal: 7,
        borderRadius: 100,
        borderWidth: 1,
        transform: [{ translateY: 2 }],
    },
});

interface CommitProps {
    commit: CommitObj;
    state?: CommitState;
    onPress?: () => void;
}

export default function Commit({ commit, state, onPress }: CommitProps) {
    const styles = useStyles();

    let title = (
        <Text variant="text-md/medium" color="TEXT_NORMAL" numberOfLines={1}>
            {commit.commit.message}
        </Text>
    );

    const labelTitle = parseConventionalCommit(commit.commit.message);
    if (labelTitle) {
        const labelColor = conventionalCommitLabelColors[labelTitle.rawType] ?? [255, 255, 255, 0, 0, 100];

        const perceivedLightness =
            (labelColor[0] * 0.2126 + labelColor[1] * 0.7152 + labelColor[2] * 0.0722) / 255;

        const lightnessThreshold = getDiscordTheme() === "light" ? 0.453 : 0.6;
        const lightnessSwitch = Math.max(
            0,
            Math.min(1 / (lightnessThreshold - perceivedLightness), 1),
        ) * 100;
        const lightenBy = (lightnessThreshold - perceivedLightness) * lightnessSwitch;

        title = (
            <Text variant="text-md/medium" color="TEXT_NORMAL" style={styles.labelTitle} numberOfLines={1}>
                <RN.View
                    style={[
                        styles.label,
                        getDiscordTheme() === "light"
                            ? {
                                backgroundColor: `rgb(${labelColor[0]}, ${labelColor[1]}, ${labelColor[2]})`,
                                borderWidth: 0,
                            }
                            : {
                                backgroundColor: `rgba(${labelColor[0]}, ${labelColor[1]}, ${labelColor[2]}, 0.3)`,
                                borderColor: `hsla(${labelColor[3]}, ${labelColor[4]}%, ${labelColor[5] + lightenBy}%, 0.18)`,
                            },
                    ]}
                >
                    <RN.Text
                        style={
                            getDiscordTheme() === "light"
                                ? { color: `hsl(0, 0%, ${lightnessSwitch}%)` }
                                : { color: `hsl(${labelColor[3]}, ${labelColor[4]}%, ${labelColor[5] + lightenBy}%)` }
                        }
                    >
                        {labelTitle.type}
                    </RN.Text>
                </RN.View>{" "}
                {labelTitle.scope && <Text color="TEXT_MUTED">{labelTitle.scope}</Text>}
                {commit.commit.message.replace(conventionalCommitRegex, "")}
            </Text>
        );
    }

    const locale = "en-US";

    return (
        <PressableScale
            style={[
                styles.card,
                state === CommitState.Selected && styles.cardSelected,
                state === CommitState.Default && styles.cardDefault,
            ]}
            onPress={onPress}
            key={commit.sha}
        >
            <Stack spacing={6}>
                <RN.View style={styles.title}>
                    <RN.Image
                        style={styles.avatar}
                        source={
                            commit.committer
                                ? { uri: commit.committer.avatar_url, cache: "force-cache" }
                                : findAssetId("default_avatar_0")
                        }
                        resizeMode="cover"
                    />
                    <Text
                        variant="text-md/medium"
                        color="TEXT_NORMAL"
                        style={{ transform: [{ translateY: -1 }] }}
                    >
                        {commit.commit.committer.name}
                    </Text>
                    <Text
                        variant="text-xs/medium"
                        color="TEXT_MUTED"
                        style={{ marginLeft: "auto" } as any}
                    >
                        {new Date(commit.commit.committer.date).toLocaleDateString(locale)}
                    </Text>
                </RN.View>
                {title}
            </Stack>
        </PressableScale>
    );
}

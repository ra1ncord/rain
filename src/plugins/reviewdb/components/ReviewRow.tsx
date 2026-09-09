import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import { createStyles } from "@api/ui/styles";
import { showToast } from "@api/ui/toasts";
import { findByNameLazy, findByProps } from "@metro";
import { ReactNative as RN } from "@metro/common";
import { Forms } from "@metro/common/components";
import { UserStore } from "@metro/common/stores";
import { ViewProps } from "react-native";

import { Review } from "../def";
import { deleteReviewVote, voteReview } from "../lib/api";
import showReviewActionSheet from "../lib/showReviewActionSheet";
import { useThemedColor } from "../lib/utils";
import { useReviewDBSettings } from "../storage";
import ReviewUsername from "./ReviewUsername";

interface ReviewRowProps {
    review: Review;
    userId: string;
    style: ViewProps["style"];
}

const { getCurrentUser } = UserStore;
const showUserProfileActionSheet = findByNameLazy("showUserProfileActionSheet");

const ArrowUpId =
    findAssetId("ArrowLargeUpIcon") ??
    findAssetId("ChevronUpIcon") ??
    findAssetId("up_arrow");
const ArrowDownId =
    findAssetId("ArrowLargeDownIcon") ??
    findAssetId("ChevronDownIcon") ??
    findAssetId("down_arrow");

const useStyles = createStyles({
    avatar: {
        height: 36,
        width: 36,
        borderRadius: 18,
    },
    card: {
        backgroundColor: semanticColors.CARD_SECONDARY_BG,
    },
    voteColumn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    voteButtons: {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
    },
    voteButton: {
        width: 20,
        height: 20,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 4,
    },
    voteArrow: {
        width: 14,
        height: 14,
    },
    voteScore: {
        minWidth: 20,
        textAlign: "center",
        fontSize: 14,
        fontWeight: "700",
    },
});

const { FormRow, FormSubLabel } = Forms;
const { TableRowGroup } = findByProps("TableRow");

export default ({ review, userId, style }: ReviewRowProps) => {
    const styles = useStyles();
    const reviewdbSettings = useReviewDBSettings();
    const [localVote, setLocalVote] = React.useState<boolean | null>(
        review.userVote ?? null,
    );
    const [score, setScore] = React.useState(review.score ?? 0);
    const [isVoting, setIsVoting] = React.useState(false);

    const reviewTimestamps =
        review.type !== 3
            ? new Date(review.timestamp * 1000).toLocaleDateString()
            : "";

    const mutedColor = useThemedColor("TEXT_MUTED");
    const neutralColor = useThemedColor("TEXT_NORMAL");
    const positiveColor = useThemedColor("TEXT_FEEDBACK_POSITIVE");
    const dangerColor = useThemedColor("TEXT_FEEDBACK_CRITICAL");

    const submitVote = async (isUpvote: boolean) => {
        if (isVoting) return;

        if (review.sender.discordID === getCurrentUser()?.id) {
            showToast(
                "You cannot vote on your own review.",
                findAssetId("Small"),
            );
            return;
        }

        if (!reviewdbSettings.authToken) {
            showToast(
                "You must be authenticated to vote.",
                findAssetId("Small"),
            );
            return;
        }

        setIsVoting(true);

        try {
            if (localVote === isUpvote) {
                if (await deleteReviewVote(review.id)) {
                    setLocalVote(null);
                    setScore(current => current + (isUpvote ? -1 : 1));
                }
            } else if (await voteReview(review.id, isUpvote)) {
                const delta =
                    localVote === null
                        ? isUpvote
                            ? 1
                            : -1
                        : isUpvote
                            ? 2
                            : -2;
                setLocalVote(isUpvote);
                setScore(current => current + delta);
            }
        } catch (err) {
            showToast(
                err instanceof Error ? err.message : "Failed to vote.",
                findAssetId("Small"),
            );
        } finally {
            setIsVoting(false);
        }
    };

    return (
        <TableRowGroup style={[style]}>
            <RN.Pressable
                style={({ pressed }) =>
                    pressed && { opacity: 0.6 }
                }
                onPress={() =>
                    showUserProfileActionSheet?.({
                        userId: review.sender.discordID,
                    })
                }
                onLongPress={() =>
                    showReviewActionSheet(review, userId)
                }
            >
                <FormRow
                    style={[style]}
                    label={
                        <ReviewUsername
                            username={review.sender.username}
                            badges={review.sender.badges}
                            timestamp={reviewTimestamps}
                        />
                    }
                    subLabel={
                        <FormSubLabel
                            text={review.comment}
                            style={{ color: useThemedColor("TEXT_NORMAL") }}
                        />
                    }
                    leading={
                        <RN.Image
                            style={styles.avatar}
                            source={{ uri: review.sender.profilePhoto }}
                        />
                    }
                    trailing={
                        review.type !== 3 && review.id !== 0 && ArrowUpId && ArrowDownId
                            ? (
                                <RN.View style={styles.voteColumn}>
                                    <RN.Text
                                        style={[
                                            styles.voteScore,
                                            { color: neutralColor },
                                            score > 0 && { color: positiveColor },
                                            score < 0 && { color: dangerColor },
                                        ]}
                                    >
                                        {score}
                                    </RN.Text>
                                    <RN.View style={styles.voteButtons}>
                                        <RN.Pressable
                                            style={styles.voteButton}
                                            disabled={isVoting}
                                            onPress={() => submitVote(true)}
                                        >
                                            <RN.Image
                                                style={[
                                                    styles.voteArrow,
                                                    {
                                                        tintColor:
                                                        localVote === true
                                                            ? positiveColor
                                                            : mutedColor,
                                                    },
                                                ]}
                                                source={ArrowUpId}
                                            />
                                        </RN.Pressable>
                                        <RN.Pressable
                                            style={styles.voteButton}
                                            disabled={isVoting}
                                            onPress={() => submitVote(false)}
                                        >
                                            <RN.Image
                                                style={[
                                                    styles.voteArrow,
                                                    {
                                                        tintColor:
                                                        localVote === false
                                                            ? dangerColor
                                                            : mutedColor,
                                                    },
                                                ]}
                                                source={ArrowDownId}
                                            />
                                        </RN.Pressable>
                                    </RN.View>
                                </RN.View>
                            )
                            : undefined
                    }
                />
            </RN.Pressable>
        </TableRowGroup>
    );
};

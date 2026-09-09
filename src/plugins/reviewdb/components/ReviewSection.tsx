import { ErrorBoundary } from "@api/ui/components";
import { semanticColors } from "@api/ui/components/color";
import { createStyles } from "@api/ui/styles";
import { findByName, findByProps } from "@metro";
import { React, ReactNative as RN } from "@metro/common";
import { UserStore } from "@metro/common/stores";

import { Review, ReviewData } from "../def";
import { getReviews } from "../lib/api";
import { useThemedColor } from "../lib/utils";
import { useReviewDBSettings } from "../storage";
import ReviewInput from "./ReviewInput";
import ReviewRow from "./ReviewRow";

const { getCurrentUser } = UserStore;
const UserProfileCard = findByName("UserProfileCard");

interface ReviewSectionProps {
    userId: string;
}

const { FlashList } = findByProps("FlashList");

export default function ReviewSection({ userId }: ReviewSectionProps) {
    const [data, setData] = React.useState<ReviewData | null>(null);
    const fetchReviews = () => {
        getReviews(userId)
            .then(setData)
            .catch(() => setData(null));
    };

    React.useEffect(fetchReviews, []);

    const reviews = data?.reviews ?? [];
    const reviewCount = data?.reviewCount ?? 0;

    const hasExistingReview =
        reviews.filter(i => i.sender.discordID === getCurrentUser()?.id)
            .length !== 0;

    const reviewdbSettings = useReviewDBSettings();

    const useStyles = createStyles({
        avatar: {
            height: 36,
            width: 36,
            borderRadius: 18,
        },
        card: {
            backgroundColor: semanticColors.CARD_PRIMARY_BG,
            borderRadius: 16,
            padding: 8,
        },
        reviewCard: {
            backgroundColor: semanticColors.CARD_SECONDARY_BG,
        },
    });

    const styles = useStyles();

    return (
        <ErrorBoundary>
            <RN.View style={[styles.card]}>
                <UserProfileCard
                    title={
                        <RN.Text>
                            {"Reviews"}
                            {reviewCount > 0 && (
                                <RN.Text style={{ color: useThemedColor("TEXT_MUTED") }}>
                                    {` (${reviewCount})`}
                                </RN.Text>
                            )}
                        </RN.Text>
                    }
                    styles={[styles.card]}
                >
                    <FlashList
                        ItemSeparatorComponent={() => (
                            <RN.View style={{ height: 8 }} />
                        )}
                        data={reviewdbSettings.showWarning
                            ? reviews
                            : reviews.filter(review => review.type !== 3)
                        }
                        renderItem={({ item }: { item: Review }) => (
                            <ReviewRow
                                style={styles.reviewCard}
                                review={item}
                                userId={userId}
                            />
                        )}
                        keyExtractor={(item: Review) => item.id}
                        scrollEnabled={false}
                        estimatedSize={100}
                        estimatedItemSize={74}
                    />
                    <ReviewInput
                        userId={userId}
                        refetch={fetchReviews}
                        shouldEdit={hasExistingReview}
                    />
                </UserProfileCard>
            </RN.View>
        </ErrorBoundary>
    );
}

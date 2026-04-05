import { ErrorBoundary } from "@api/ui/components";
import { semanticColors } from "@api/ui/components/color";
import { createStyles } from "@api/ui/styles";
import { findByName, findByProps, findByStoreName } from "@metro";
import { React, ReactNative as RN } from "@metro/common";

import { Review } from "../def";
import { getReviews } from "../lib/api";
import { useReviewDBSettings } from "../storage";
import ReviewInput from "./ReviewInput";
import ReviewRow from "./ReviewRow";

const { getCurrentUser } = findByStoreName("UserStore");
const UserProfileCard = findByName("UserProfileCard");

interface ReviewSectionProps {
    userId: string;
}

const { FlashList } = findByProps("FlashList");
const { getDisplayProfile } = findByProps("getDisplayProfile");

export default function ReviewSection({ userId }: ReviewSectionProps) {
    const [reviews, setReviews] = React.useState<Review[]>([]);
    const fetchReviews = () => {
        getReviews(userId).then(i => setReviews(i));
    };

    React.useEffect(fetchReviews, []);

    const hasExistingReview =
        reviews.filter(i => i.sender.discordID === getCurrentUser()?.id)
            .length !== 0;

    const themeColors = getDisplayProfile?.(userId)?.themeColors;

    const reviewdbSettings = useReviewDBSettings();

    const useStyles = createStyles({
        avatar: {
            height: 36,
            width: 36,
            borderRadius: 18,
        },
        card: {
            backgroundColor:
                themeColors === undefined
                    ? semanticColors.CARD_PRIMARY_BG
                    : "#00000073",
            borderRadius: 16,
            padding: 8,
        },
        reviewCard: {
            backgroundColor:
                themeColors === undefined
                    ? semanticColors.CARD_SECONDARY_BG
                    : "#00000083",
        },
    });

    const styles = useStyles();

    return (
        <ErrorBoundary>
            <RN.View style={[styles.card]}>
                <UserProfileCard title="Reviews" styles={[styles.card]}>
                    <FlashList
                        ItemSeparatorComponent={() => (
                            <RN.View style={{ height: 8 }} />
                        )}
                        data={reviewdbSettings.showWarning
                            ? reviews
                            : reviews.filter(review => review.type !== 3)
                        }
                        renderItem={({ item }: any) => (
                            <ReviewRow
                                style={styles.reviewCard}
                                review={item}
                            />
                        )}
                        keyExtractor={(item: any) => item.sender.username}
                        scrollEnabled={false}
                        estimatedSize={84}
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

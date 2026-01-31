import { ReactNative as RN } from "@metro/common";
import ReviewSection from "./ReviewSection";
import { ActionSheet } from "./ActionSheet";

interface ReviewCardProps {
    userId: string;
}

export default function ReviewActionSheet({ userId }: ReviewCardProps) {
    return (
        <ActionSheet title="Reviews">
            <RN.ScrollView style={{ gap: 12, marginBottom: 12 }}>
                <ReviewSection userId={userId} />
            </RN.ScrollView>
        </ActionSheet>
    );
}

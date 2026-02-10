import { semanticColors } from "@api/ui/components/color";
import { createStyles } from "@api/ui/styles";
import { findByProps } from "@metro";
import { ReactNative as RN } from "@metro/common";
import { Forms } from "@metro/common/components";
import { ViewProps } from "react-native";

import { Review } from "../def";
import showReviewActionSheet from "../lib/showReviewActionSheet";
import { useThemedColor } from "../lib/utils";
import ReviewUsername from "./ReviewUsername";

interface ReviewRowProps {
    review: Review;
    style: ViewProps["style"];
}

const useStyles = createStyles({
    avatar: {
        height: 36,
        width: 36,
        borderRadius: 18,
    },
    card: {
        backgroundColor: semanticColors.CARD_SECONDARY_BG,
    },
});

const { FormRow, FormSubLabel } = Forms;
const { TableRowGroup } = findByProps("TableRow");

export default ({ review, style }: ReviewRowProps) => {
    const styles = useStyles();

    return (
        <TableRowGroup style={[style]}>
            <FormRow
                style={[style]}
                label={
                    <ReviewUsername
                        username={review.sender.username}
                        badges={review.sender.badges}
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
                onLongPress={() => showReviewActionSheet(review)}
            />
        </TableRowGroup>
    );
};

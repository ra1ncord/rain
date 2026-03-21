import { findAssetId } from "@api/assets";
import { showConfirmationAlert } from "@api/ui/alerts";
import { showToast } from "@api/ui/toasts";
import { findByProps } from "@metro";
import { clipboard } from "@metro/common";

import { Review } from "../def";
import { useReviewDBSettings } from "../storage";
import { deleteReview, reportReview } from "./api";
import { canDeleteReview } from "./utils";
const { hideActionSheet } = findByProps("openLazy", "hideActionSheet");
const { showSimpleActionSheet } = findByProps("showSimpleActionSheet");

export default (review: Review) =>
    showSimpleActionSheet({
        key: "ReviewOverflow",
        header: {
            title:
                review.type !== 3
                    ? `Review by ${review.sender.username}`
                    : "ReviewDB System Message",
            // TODO: Return to the user profile
            onClose: () => hideActionSheet(),
        },
        options: [
            {
                label: "Copy Text",
                onPress: () => {
                    clipboard.setString(review.comment);
                    showToast(
                        "Copied Review Text",
                        findAssetId("CopyIcon"),
                    );
                },
            },
            ...(useReviewDBSettings().authToken && review.type !== 3
                ? [
                    ...(canDeleteReview(review)
                        ? [
                            {
                                label: "Delete Review",
                                isDestructive: true,
                                onPress: () =>
                                    showConfirmationAlert({
                                        title: "Delete Review",
                                        content:
                                                "Are you sure you want to delete this review?",
                                        confirmText: "Yes",
                                        cancelText: "No",
                                        // @ts-ignore
                                        confirmColor: "red",
                                        onConfirm: () =>
                                            deleteReview(
                                                review.sender.discordID,
                                                review.id,
                                            ),
                                    }),
                            },
                        ]
                        : []),
                    {
                        label: "Report Review",
                        isDestructive: true,
                        onPress: () =>
                            showConfirmationAlert({
                                title: "Report Review",
                                content:
                                      "Are you sure you want to report this review?",
                                confirmText: "Yes",
                                cancelText: "No",
                                // @ts-ignore
                                confirmColor: "red",
                                onConfirm: () => reportReview(review.id),
                            }),
                    },
                ]
                : []),
        ],
    });

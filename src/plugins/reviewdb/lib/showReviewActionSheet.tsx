import { findAssetId } from "@api/assets";
import { showConfirmationAlert } from "@api/ui/alerts";
import { showToast } from "@api/ui/toasts";
import { findByProps } from "@metro";
import { clipboard } from "@metro/common";

import { Review } from "../def";
import { reviewdbSettings } from "../storage";
import { deleteReview, reportReview } from "./api";
import { canDeleteReview } from "./utils";

const { showSimpleActionSheet } = findByProps("showSimpleActionSheet");
const { hideActionSheet } = findByProps("openLazy", "hideActionSheet");

export default (review: Review, userId: string) => {
    const isSystem = review.type === 3;

    const confirmDelete = () =>
        showConfirmationAlert({
            title: "Delete Review",
            content: "Are you sure you want to delete this review?",
            confirmText: "Yes",
            cancelText: "No",
            confirmColor: "red",
            onConfirm: () => deleteReview(userId, review.id),
        });

    const confirmReport = () =>
        showConfirmationAlert({
            title: "Report Review",
            content: "Are you sure you want to report this review?",
            confirmText: "Yes",
            cancelText: "No",
            confirmColor: "red",
            onConfirm: () => reportReview(review.id),
        });

    showSimpleActionSheet({
        key: "ReviewActionsSheet",
        header: {
            title: isSystem
                ? "ReviewDB System Message"
                : `Review by ${review.sender.username}`,
            onClose: () => hideActionSheet()
        },
        options: [
            {
                icon: findAssetId("CopyIcon"),
                label: "Copy Text",
                onPress: () => {
                    clipboard.setString(review.comment);
                    showToast("Copied Review Text", findAssetId("CopyIcon"));
                }
            },
            ...(reviewdbSettings.authToken &&
                !isSystem &&
                canDeleteReview(review, userId)
                ? [
                    {
                        icon: findAssetId("TrashIcon"),
                        label: "Delete Review",
                        isDestructive: true,
                        onPress: confirmDelete
                    }
                ]
                : []),
            ...(reviewdbSettings.authToken && !isSystem
                ? [
                    {
                        icon: findAssetId("FlagIcon"),
                        label: "Report Review",
                        isDestructive: true,
                        onPress: confirmReport
                    }
                ]
                : [])
        ]
    });
};

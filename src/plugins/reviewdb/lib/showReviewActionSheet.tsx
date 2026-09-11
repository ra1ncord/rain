import { findAssetId } from "@api/assets";
import { showConfirmationAlert } from "@api/ui/alerts";
import { showToast } from "@api/ui/toasts";
import { findByProps } from "@metro";
import { clipboard } from "@metro/common";

import { Review } from "../def";
import { reviewdbSettings } from "../storage";
import { deleteReview, reportReview } from "./api";
import { canModifyReview } from "./utils";

const { showSimpleActionSheet } = findByProps("showSimpleActionSheet");
const { hideActionSheet } = findByProps("openLazy", "hideActionSheet");

type ActionOption = {
    icon: ReturnType<typeof findAssetId>;
    label: string;
    isDestructive?: boolean;
    onPress: () => void;
};

const copyOption = (review: Review): ActionOption => ({
    icon: findAssetId("CopyIcon"),
    label: "Copy Text",
    onPress: () => {
        clipboard.setString(review.comment);
        showToast("Copied Review Text", findAssetId("CopyIcon"));
    },
});

export default (review: Review, profileOwnerId: string) => {
    const isSystem = review.type === 3;

    const destructive: ActionOption[] = [];
    if (reviewdbSettings.authToken && !isSystem) {
        if (canModifyReview(review, profileOwnerId)) {
            destructive.push({
                icon: findAssetId("TrashIcon"),
                label: "Delete Review",
                isDestructive: true,
                onPress: () =>
                    showConfirmationAlert({
                        title: "Delete Review",
                        content: "Are you sure you want to delete this review?",
                        confirmText: "Yes",
                        cancelText: "No",
                        confirmColor: "red",
                        onConfirm: () => deleteReview(profileOwnerId, review.id),
                    }),
            });
        }
        destructive.push({
            icon: findAssetId("FlagIcon"),
            label: "Report Review",
            isDestructive: true,
            onPress: () =>
                showConfirmationAlert({
                    title: "Report Review",
                    content: "Are you sure you want to report this review?",
                    confirmText: "Yes",
                    cancelText: "No",
                    confirmColor: "red",
                    onConfirm: () => reportReview(review.id),
                }),
        });
    }

    showSimpleActionSheet({
        key: "ReviewActionsSheet",
        header: {
            title: isSystem
                ? "ReviewDB System Message"
                : `Review by ${review.sender.username}`,
            onClose: () => hideActionSheet()
        },
        options: [
            copyOption(review),
            ...destructive,
        ]
    });
};

import { findAssetId } from "@api/assets";
import { showConfirmationAlert } from "@api/ui/alerts";
import { showToast } from "@api/ui/toasts";
import { findByProps, findByStoreName } from "@metro";
import { clipboard,ReactNative } from "@metro/common";

import { Decoration } from "../api";
import { useCurrentUserDecorationsStore } from "../stores/CurrentUserDecorationsStore";
import discordifyDecoration from "./discordifyDecoration";

const ImageResolver = findByProps("getAvatarDecorationURL", "default");
const { showSimpleActionSheet } = findByProps("showSimpleActionSheet");
const { hideActionSheet } = findByProps("openLazy", "hideActionSheet");
const UserStore = findByStoreName("UserStore");

const { Image } = ReactNative;

export default (decoration: Decoration) =>
    showSimpleActionSheet({
        key: "DecorationActionSheet",
        header: {
            title: decoration.alt ?? "Decoration",
            icon: (
                <Image
                    source={{ uri: ImageResolver.getAvatarDecorationURL({ avatarDecoration: discordifyDecoration(decoration) }) }}
                    style={{ width: 24, height: 24, marginRight: 8 }}
                />
            ),
            onClose: () => hideActionSheet()
        },
        options: [
            {
                icon: findAssetId("CopyIcon"),
                label: "Copy Decoration Hash",
                onPress: () => {
                    clipboard.setString(decoration.hash);
                    showToast("Copied Decoration Hash!", findAssetId("toast_copy_message"));
                }
            },
            ...(decoration.authorId === UserStore.getCurrentUser().id
                ? [
                    {
                        icon: findAssetId("ic_message_delete"),
                        label: "Delete",
                        isDestructive: true,
                        onPress: () =>
                            showConfirmationAlert({
                                title: "Delete Decoration",
                                content: `Are you sure you want to delete ${decoration.alt ?? "this decoration"}?`,
                                confirmText: "Delete",
                                cancelText: "Cancel",
                                confirmColor: "red" as ButtonColors.RED,
                                onConfirm: () =>
                                    ReactNative.unstable_batchedUpdates(() => useCurrentUserDecorationsStore.getState().delete(decoration))
                            })
                    }
                ]
                : [])
        ]
    });

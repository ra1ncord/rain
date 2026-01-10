import { findAssetId } from "@api/assets";
import { lazyDestructure } from "@lib/utils/lazy";
import { toasts } from "@metro/common";
import { findByProps } from "@metro/wrappers";

const { uuid4 } = lazyDestructure(() => findByProps("uuid4"));

export const showToast = (content: string, asset?: number) => toasts.open({
    key: `rain-toast-${uuid4()}`,
    content: content,
    source: asset,
    icon: asset,
});

showToast.showCopyToClipboard = (message = "Strings.COPIED_TO_CLIPBOARD") => {
    showToast(message, findAssetId("toast_copy_link"));
};

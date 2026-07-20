import { findByProps } from "@metro";
import { findByPropsLazy } from "@metro/wrappers";

export const Surrogates = findByPropsLazy("convertSurrogateToName")?.();
export const LazyActionSheet = findByPropsLazy("hideActionSheet")?.();
export const MediaModalUtils = findByPropsLazy("openMediaModal")?.();
export const Emojis = findByPropsLazy("uploadEmoji");

export const {
    BottomSheetFlatList
} = findByPropsLazy("BottomSheetScrollView")?.() || {};

export const {
    default: GuildIcon,
    GuildIconSizes
} = findByPropsLazy("GuildIconSizes")?.() || {};

export const {
    downloadMediaAsset
} = findByProps("downloadMediaAsset") || {};

import { proxyLazy } from "@lib/utils/lazy";
import { findByPropsLazy } from "@metro";
import { Text } from "@metro/common/components";
import type { ReactNode } from "react";
import { View } from "react-native";

const ActionSheetCloseButton = proxyLazy(() => findByPropsLazy("ActionSheetCloseButton").ActionSheetCloseButton);

export default function SheetHeader({ title, titleColor, left, onClose }: {
    title?: string;
    titleColor?: string;
    left?: ReactNode;
    onClose: () => void;
}) {
    return (
        <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16 }}>
            {left ?? null}
            {title != null && (
                <Text variant="heading-md/semibold" style={{ flex: 1, textAlign: "center", ...(titleColor ? { color: titleColor } : {}) }}>
                    {title}
                </Text>
            )}
            <ActionSheetCloseButton onPress={onClose} />
        </View>
    );
}

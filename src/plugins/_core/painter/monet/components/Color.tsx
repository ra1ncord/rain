import { findAssetId } from "@api/assets";
import { semanticColors } from "@api/ui/components/color";
import { showToast } from "@api/ui/toasts";
import { findByName } from "@metro";
import { clipboard, ReactNative as RN } from "@metro/common";
import { Text } from "@metro/common/components";

const CustomColorPickerActionSheet = findByName("CustomColorPickerActionSheet");

interface ColorProps {
    title: string;
    color: string;
    update: (color: string) => void;
}

export default function Color({ title, color, update }: ColorProps) {
    const showSheet = () => {
        if (CustomColorPickerActionSheet) {
            // Open color picker by navigating to action sheet
            // This relies on Discord's built-in color picker
            try {
                const { openLazy, hideActionSheet } = require("@metro/common").findByProps?.("openLazy", "hideActionSheet") ?? {};
                if (openLazy) {
                    openLazy(
                        Promise.resolve({ default: CustomColorPickerActionSheet }),
                        "CustomColorPickerActionSheet",
                        {
                            color: Number.parseInt(color.slice(1), 16),
                            onSelect: (clr: number) => {
                                update(`#${clr.toString(16).padStart(6, "0")}`);
                            },
                        },
                    );
                }
            } catch {}
        }
    };

    return (
        <RN.View
            style={{
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1 / 5,
            }}
        >
            <RN.Pressable
                android_ripple={{
                    color: semanticColors.ANDROID_RIPPLE,
                    borderless: true,
                }}
                accessibilityRole="button"
                accessibilityLabel={`${title} Color Preview`}
                style={{
                    width: 48,
                    aspectRatio: 1,
                    backgroundColor: color,
                    borderRadius: 2147483647,
                    marginBottom: 8,
                }}
                onPress={showSheet}
                onLongPress={() => {
                    clipboard.setString(color);
                    showToast("Copied", findAssetId("toast_copy_link"));
                }}
            />
            <Text variant="text-xs/medium" style={{ textAlign: "center" }}>
                {title}
            </Text>
        </RN.View>
    );
}

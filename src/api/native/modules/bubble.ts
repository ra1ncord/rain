import { processColor } from "react-native";

import { callBridgeMethod } from "../bridge";

export default {
    hookBubbles: () => callBridgeMethod("bubbles.hook"),
    unhookBubbles: () => callBridgeMethod("bubbles.unhook"),
    configure: (avatarRadius?: number, bubbleRadius?: number, bubbleColor?: string | null) => {
        // Only call processColor when a color string is provided.
        // If no color is provided (undefined or null) pass `undefined` so native side can fall back to theme/default.
        const processedColor = typeof bubbleColor === "string" && bubbleColor.trim().length > 0
            ? Number(processColor(bubbleColor))
            : undefined;
        return callBridgeMethod("bubbles.configure", avatarRadius, bubbleRadius, processedColor);
    },
};

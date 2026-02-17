import { processColor } from "react-native";
import { callBridgeMethod } from "../bridge";

export default {
    hookBubbles: () => callBridgeMethod("bubbles.hook"),
    unhookBubbles: () => callBridgeMethod("bubbles.unhook"),
    configure: (avatarRadius?: number, bubbleRadius?: number, bubbleColor?: string) =>
        callBridgeMethod("bubbles.configure", avatarRadius, bubbleRadius, Number(processColor(bubbleColor))),
};
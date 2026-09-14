import type { ReactNode } from "react";
import type { NativeSyntheticEvent } from "react-native";

export type MessageTapEvent = NativeSyntheticEvent<{ channelId: string; messageId: string }>;

export interface MessageViewProps {
    children?: ReactNode;
    onDoubleTapMessage?: (event: MessageTapEvent) => void;
    onTapUsername?: (event: MessageTapEvent) => void;
}

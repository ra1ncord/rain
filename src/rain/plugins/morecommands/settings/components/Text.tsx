/*
Stolen from https://github.com/nexpid/RevengePlugins/blob/main/src/stuff/components/Text.tsx

Thanks to Nexpid honestly :D
*/
import { resolveSemanticColor,semanticColors } from "@api/ui/components/color";
import { TextStyleSheet } from "@api/ui/styles";
import type { TextStyles } from "@api/ui/types";
import { findByProps } from "@metro";
import { React, ReactNative as RN } from "@metro/common";
import type { TextProps } from "react-native";

export function TrailingText({ children }: React.PropsWithChildren<object>) {
    return (
        <Text variant="text-md/medium" color="TEXT_MUTED">
            {children}
        </Text>
    );
}

const { useThemeContext } = findByProps("useThemeContext");

export default function Text({
    variant,
    lineClamp,
    color,
    align,
    style,
    onPress,
    getChildren,
    children,
    liveUpdate,
    ellipsis,
}: React.PropsWithChildren<{
	variant?: TextStyles;
	color?: string;
	getChildren?: () => React.ReactNode | undefined;
	liveUpdate?: boolean;

	lineClamp?: TextProps["numberOfLines"];
	align?: "left" | "right" | "center";
	style?: TextProps["style"];
	onPress?: TextProps["onPress"];
	ellipsis?: TextProps["ellipsizeMode"];
}>) {
    const themeContext = useThemeContext();
    const [_, forceUpdate] = React.useReducer(x => ~x, 0);

    React.useEffect(() => {
        if (!liveUpdate) return;
        const nextSecond = () => Date.now() - new Date().setMilliseconds(1000);

        let timeout = setTimeout(function update() {
            forceUpdate();
            timeout = setTimeout(update, nextSecond());
        }, nextSecond());

        return () => clearTimeout(timeout);
    }, []);

    return (
        <RN.Text
            style={[
                variant && TextStyleSheet[variant],
                color
                    ? {
                        color: resolveSemanticColor(
                            semanticColors[color],
                            themeContext?.theme,
                        ),
                    }
                    : {},
                align && { textAlign: align },
                style ?? {},
            ]}
            numberOfLines={lineClamp}
            onPress={onPress}
            ellipsizeMode={ellipsis}
        >
            {getChildren?.() ?? children}
        </RN.Text>
    );
}

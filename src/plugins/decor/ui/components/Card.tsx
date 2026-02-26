import { semanticColors } from "@api/ui/components/color";
import { createStyles } from "@api/ui/styles";
import { findByProps } from "@metro";
import { ReactNative } from "@metro/common";


const { View, TouchableOpacity } = ReactNative;

const { triggerHapticFeedback, HapticFeedbackTypes } = findByProps("triggerHapticFeedback");

const useStyles = createStyles(_ => ({
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: semanticColors.BACKGROUND_FLOATING,
        width: 72,
        height: 72,
        borderRadius: 4
    },
    inner: {
        display: "flex",
        justifyContent: "space-evenly",
        alignItems: "center"
    },
    selected: {
        borderWidth: 2,
        borderColor: semanticColors.BUTTON_OUTLINE_BRAND_BORDER_ACTIVE
    },
    disabled: {
        opacity: 0.5
    }
}));

const hapticFeedbackWrapper = (fn, ...args) => {
    triggerHapticFeedback(HapticFeedbackTypes.IMPACT_LIGHT);
    fn(...args);
};


export default function Card({
    onPress = undefined,
    onLongPress = undefined,
    disabled = undefined,
    lookDisabled = undefined,
    selected = false,
    children
}) {
    const styles = useStyles();
    return (
        <TouchableOpacity
            onPress={onPress ? (...args) => hapticFeedbackWrapper(onPress, ...args) : undefined}
            onLongPress={onLongPress ? (...args) => hapticFeedbackWrapper(onLongPress, ...args) : undefined}
            disabled={disabled}
        >

            <View style={[styles.container, selected ? styles.selected : null]}>
                <View style={[styles.inner, (disabled || lookDisabled) && styles.disabled]}>{children}</View>
            </View>
        </TouchableOpacity>
    );
    /*
	return (
		<TouchableOpacity
			onPress={onPress ? () => hapticFeedbackWrapper(onPress) : undefined}
			onLongPress={onLongPress ? () => hapticFeedbackWrapper(onLongPress) : undefined}
			disabled={disabled}
		>
			<View style={[styles.container, selected ? styles.selected : null]}>
				<View style={[styles.inner, (disabled || lookDisabled) && styles.disabled]}>{children}</View>
			</View>
		</TouchableOpacity>
	);

	 */
}

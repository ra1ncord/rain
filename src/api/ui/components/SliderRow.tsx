import { Slider, Text } from "@metro/common/components";
import { StyleSheet,View } from "react-native";

import { semanticColors } from "./color";

export const SliderRow = ({ label, value, onChange, minimumValue = 0, maximumValue = 100, suffix = "px" }: {
    label?: string;
    value: number;
    minimumValue?: number;
    maximumValue?: number;
    onChange: (v: number) => void;
    suffix?: string;
}) => {
    return (
        <View>
            <View style={styles.labelRow}>
                <Text variant="text-sm/semibold" color="text-muted">{label}</Text>
                <Text variant="text-md/medium" color="text-muted">{value}{suffix}</Text>
            </View>
            <Slider
                value={value}
                minimumValue={minimumValue}
                maximumValue={maximumValue}
                onValueChange={v => onChange(Math.round(v))}
                minimumTrackTintColor={semanticColors.BRAND_500}
                maximumTrackTintColor={semanticColors.BACKGROUND_TERTIARY}
                thumbTintColor={semanticColors.BRAND_500}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    labelRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
});

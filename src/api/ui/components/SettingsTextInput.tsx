import { TextInput as MetroTextInput } from "@metro/common/components";
import { View, ViewStyle } from "react-native";

import ErrorBoundary from "./ErrorBoundary";

export interface SettingsTextInputProps {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    style?: ViewStyle;
    size?: "sm" | "md" | "lg";
    isClearable?: boolean;
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
    autoCorrect?: boolean;
    leadingText?: string;
}

export default function SettingsTextInput({
    value,
    onChange,
    placeholder,
    style,
    leadingText,
    size = "md",
    isClearable = true,
    autoCapitalize = "none",
    autoCorrect = false,
}: SettingsTextInputProps) {
    return (
        <ErrorBoundary>
            <View style={style}>
                <MetroTextInput
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    size={size}
                    isClearable={isClearable}
                    autoCapitalize={autoCapitalize}
                    autoCorrect={autoCorrect}
                    leadingText={leadingText}
                />
            </View>
        </ErrorBoundary>
    );
}

import { React } from "@metro/common";
import { findByProps } from "@metro";
import { ScrollView, Text } from "react-native";
import { useEffect } from "react";
import {
    useDebugInfo,
    logComponentMount,
    logComponentError,
} from "../../utils/debug";

const { FormText } = findByProps("FormText");

export default React.memo(function Debug() {
    useEffect(() => {
        logComponentMount("Debug");
    }, []);

    try {
        const debugInfo = useDebugInfo();

        if (!debugInfo) {
            logComponentError("Debug", "useDebugInfo returned null or undefined");
            return (
                <ScrollView>
                    <FormText style={{ margin: 12 }}>
                        No debug information available
                    </FormText>
                </ScrollView>
            );
        }

        return (
            <ScrollView>
                <Text
                    selectable
                    style={{
                        margin: 12,
                        fontFamily: "monospace",
                        fontSize: 12,
                        backgroundColor: "#2f3136",
                        color: "#dcddde",
                        padding: 8,
                        borderRadius: 4,
                    }}
                >
                    {debugInfo}
                </Text>
            </ScrollView>
        );
    } catch (error) {
        logComponentError("Debug", error);
        console.error("Debug component error:", error);
        return (
            <ScrollView>
                <FormText style={{ margin: 12, color: "#FF0000" }}>
                    Error loading debug information: {String(error)}
                </FormText>
            </ScrollView>
        );
    }
});

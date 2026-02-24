import { findAssetId } from "@api/assets";
import { rawColors, semanticColors } from "@api/ui/components/color";
import { createStyles } from "@api/ui/styles";
import { showToast } from "@api/ui/toasts";
import { findByProps } from "@metro";
import { constants, ReactNative as RN } from "@metro/common";

import { addReview } from "../lib/api";
import { Button,TextInput } from "../lib/redesign";
import { useThemedColor } from "../lib/utils";
import { useReviewDBSettings } from "../storage";

interface ReviewInputProps {
    userId: string;
    shouldEdit?: boolean;
    refetch: () => void;
}

const useStyles = createStyles({
    container: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    container_redesign: {
        backgroundColor: semanticColors.CARD_PRIMARY_BG,
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    textInput: {
        flex: 1,
        flexGrow: 1,
        fontSize: 16,
        fontFamily: constants.Fonts.DISPLAY_MEDIUM,
    },
    sendButton: {
        flexShrink: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 40,
        minWidth: 40,
        borderRadius: 999,
    },
});

const { useThemeContext } = findByProps("useThemeContext");

export default function ReviewInput({
    userId,
    shouldEdit,
    refetch,
}: ReviewInputProps) {
    const styles = useStyles();
    const reviewdbSettings = useReviewDBSettings();
    const [reviewText, setReviewText] = React.useState("");
    const disableTextArea = !reviewdbSettings.authToken;
    const disableButton =
        !reviewdbSettings.authToken || reviewText.length === 0;

    if (TextInput) {
        return (
            <RN.View>
                <TextInput
                    style={{
                        ...styles.textInput,
                        color: useThemedColor("TEXT_NORMAL"),
                    }}
                    isDisabled={disableTextArea}
                    placeholder={
                        disableTextArea
                            ? "You must be authenticated to add a review."
                            : `Tap to ${shouldEdit ? "edit your" : "add a"} review`
                    }
                    placeholderTextColor={useThemedColor(
                        "INPUT_PLACEHOLDER_TEXT",
                    )}
                    value={reviewText}
                    onChange={(i: string) => setReviewText(i)}
                />
                <Button
                    size="sm"
                    style={{
                        ...styles.sendButton,
                        backgroundColor:
                            (reviewdbSettings.useThemedSend &&
                                useThemeContext().primaryColor) ||
                            rawColors.BRAND_500,
                        opacity: disableButton ? 0.25 : 1,
                    }}
                    text=""
                    icon={
                        <RN.Image
                            style={{ tintColor: "#fff" }}
                            source={findAssetId("ic_send")}
                        />
                    }
                    disabled={disableButton}
                    onPress={() => {
                        addReview(userId, reviewText)
                            .then(res => {
                                setReviewText("");
                                refetch();
                                showToast(res.message, findAssetId("Check"));
                            })
                            .catch((err: Error) =>
                                showToast(err.message, findAssetId("Small")),
                            );
                    }}
                />
            </RN.View>
        );
    }

    return (
        <RN.View style={styles.container}>
            <RN.TextInput
                style={{
                    ...styles.textInput,
                    color: useThemedColor("TEXT_NORMAL"),
                }}
                editable={disableTextArea}
                placeholder={
                    disableTextArea
                        ? "You must be authenticated to add a review."
                        : `Tap to ${shouldEdit ? "edit your" : "add a"} review`
                }
                placeholderTextColor={useThemedColor("INPUT_PLACEHOLDER_TEXT")}
                value={reviewText}
                onChangeText={(i: string) => setReviewText(i)}
            />
            <RN.Pressable
                style={{
                    ...styles.sendButton,
                    backgroundColor:
                        (reviewdbSettings.useThemedSend &&
                            useThemeContext().primaryColor) ||
                        rawColors.BRAND_500,
                    opacity: disableButton ? 0.25 : 1,
                }}
                disabled={disableButton}
                onPress={() => {
                    addReview(userId, reviewText)
                        .then(res => {
                            setReviewText("");
                            refetch();
                            showToast(res.message, findAssetId("Check"));
                        })
                        .catch((err: Error) =>
                            showToast(err.message, findAssetId("Small")),
                        );
                }}
            >
                <RN.Image
                    style={{ tintColor: "#fff" }}
                    source={findAssetId("ic_send")}
                />
            </RN.Pressable>
        </RN.View>
    );
}

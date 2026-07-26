import { resolveSemanticColor, semanticColors } from "@api/ui/components/color";
import { findByProps } from "@metro";
import { ReactNative } from "@metro/common";
import { findByName } from "@metro/wrappers";

import { betteryoubarSettings } from "../storage";
const { Image, View } = ReactNative;

const LinearGradient = findByName("LinearGradient");

export interface PatchOptions {
    UserStore: any;
    UserProfileStore?: any;
    transitionToGuild: any;
    openUserSettings: any;
    IconButton: any;
}

export const FadeOverlay = ({ color }: { color: string }) => (
    <LinearGradient
        pointerEvents="none"
        colors={[color, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1.3, y: 0 }}
        style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
        }}
    />
);

export function applyBannerLogic(res: any) {
    const mode = betteryoubarSettings.backgroundMode;
    const url = betteryoubarSettings.customImageUrl;

    if (mode === "none") {
        if (res?.props) {
            return {
                ...res,
                props: {
                    ...res.props,
                    children: <View style={{ width: "100%", height: "100%" }} />
                }
            };
        }
        return res;
    }

    if (mode === "custom_image" && url && url.trim() !== "") {
        if (res?.props) {
            const bgColor = resolveSemanticColor(semanticColors.MOBILE_FLOATINGBAR_BACKGROUND ?? semanticColors.MOBILE_FLOATINGBAR_BACKGROUND_NAMEPLATE ?? semanticColors.BACKGROUND_TERTIARY);

            return {
                ...res,
                props: {
                    ...res.props,
                    children: (
                        <View style={{ width: "100%", height: "100%" }}>
                            <Image
                                source={{ uri: url.trim() }}
                                style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}
                                resizeMode="cover"
                            />
                            <FadeOverlay color={bgColor} />
                        </View>
                    )
                }
            };
        }
    }

    return res;
}

export function createIconElement(asset: any, hasNameplate: boolean) {
    return (
        <View style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            <Image
                source={asset}
                style={{ width: 16, height: 16, tintColor: hasNameplate ? "white" : undefined }}
            />
        </View>
    );
}

let triggerHapticFeedback: any, HapticFeedbackTypes: any, getRootNavigationRef: any, Navigation: any, ForLaterModalModule: any;

export function getNotificationButtonHandlers() {
    if (!Navigation) {
        const haptics = findByProps("triggerHapticFeedback", "HapticFeedbackTypes") || {};
        triggerHapticFeedback = haptics.triggerHapticFeedback;
        HapticFeedbackTypes = haptics.HapticFeedbackTypes;
        getRootNavigationRef = (findByProps("getRootNavigationRef") || {}).getRootNavigationRef;
        Navigation = findByProps("pushLazy", "push");
        ForLaterModalModule = findByProps("ForLaterModal");
    }

    const onPress = () => {
        getRootNavigationRef?.()?.navigate("notifications", { inNestedNavigator: true });
    };

    const onLongPress = () => {
        if (triggerHapticFeedback && HapticFeedbackTypes) triggerHapticFeedback(HapticFeedbackTypes.SOFT);
        if (Navigation?.pushLazy && ForLaterModalModule?.ForLaterModal) {
            Navigation.pushLazy(() => Promise.resolve(ForLaterModalModule.ForLaterModal), {}, "for-later-modal", { presentation: "modal" });
        }
    };

    return { onPress, onLongPress };
}

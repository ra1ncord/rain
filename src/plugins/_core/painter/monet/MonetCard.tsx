import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import { NavigationNative, React, ReactNative as RN } from "@metro/common";
import AddonCard from "@rain/pages/Addon/AddonCard";

import { useThemes } from "../themes";
import usePatches from "./hooks/usePatches";
import { applyMonetTheme, hasMonetTheme } from "./index";
import Settings from "./Settings";
import { build } from "./stuff/buildTheme";

export default function MonetCard() {
    const navigation = NavigationNative.useNavigation();
    const isMonetActive = hasMonetTheme();
    const { patches } = usePatches();

    const hasUrlTheme = useThemes(
        React.useCallback(
            (state: any) => Object.values(state.themes).some((t: any) => t.selected),
            [],
        ),
    );
    const isSelected = isMonetActive && !hasUrlTheme;

    // Only show on Android
    if (RN.Platform.OS !== "android") return null;

    return (
        <AddonCard
            headerLabel="Material You"
            headerSublabel="by LampDelivery & nexpid"
            headerLabelVariant="heading-lg/semibold"
            headerSublabelVariant="text-sm/semibold"
            headerSublabelColor="text-muted"
            descriptionLabel="Dynamic Material You theming for Discord, using your device's color palette."
            toggleType="radio"
            toggleValue={() => isSelected}
            onToggleChange={async (v: boolean) => {
                if (!v) {
                    applyMonetTheme(null);
                } else {
                    if (hasUrlTheme) {
                        await useThemes.getState().selectTheme(null);
                    }
                    if (!patches) {
                        showToast(
                            "Patches not loaded yet, try again",
                            findAssetId("CircleXIcon-primary"),
                        );
                        return;
                    }
                    try {
                        const theme = build(patches);
                        applyMonetTheme(theme);
                    } catch (e) {
                        showToast(
                            "Failed to build theme",
                            findAssetId("CircleXIcon-primary"),
                        );
                    }
                }
            }}
            actions={[
                {
                    icon: "SettingsIcon",
                    onPress: () => {
                        navigation.push("RAIN_CUSTOM_PAGE", {
                            title: "Material You",
                            render: Settings,
                        });
                    },
                },
            ]}
        />
    );
}

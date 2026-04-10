import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import { NavigationNative, React, ReactNative as RN } from "@metro/common";
import AddonCard from "@rain/pages/Addon/AddonCard";

import { useThemes } from "../themes";
import usePatches from "./hooks/usePatches";
import { applyMonetTheme, hasMonetTheme } from "./index";
import Settings from "./Settings";
import { build } from "./stuff/buildTheme";

export default function MonetCard({ compact }: { compact?: boolean }) {
    const navigation = NavigationNative.useNavigation();
    const isMonetActive = hasMonetTheme();
    const { patches } = usePatches();

    const hasUrlTheme = useThemes((state: any) =>
        Object.values(state.themes).some((t: any) => t.selected)
    );

    const isSelected = isMonetActive && !hasUrlTheme;

    // Only show on Android
    if (RN.Platform.OS !== "android") return null;

    const [version, setVersion] = React.useState(0);
    const forceUpdate = () => setVersion(v => v + 1);

    if (compact) {
        return (
            <AddonCard
                compact
                headerLabel="Material You"
                toggleType="radio"
                toggleValue={() => isSelected}
                onToggleChange={async (v: boolean) => {
                    if (!v) {
                        applyMonetTheme(null);
                    } else {
                        await useThemes.getState().selectTheme(null);

                        if (!patches) {
                            showToast("Patches not loaded yet", findAssetId("CircleXIcon-primary"));
                            return;
                        }
                        try {
                            const theme = build(patches);
                            applyMonetTheme(theme);
                        } catch (e) {
                            showToast("Failed to build theme", findAssetId("CircleXIcon-primary"));
                        }
                    }
                    forceUpdate();
                }}
                actions={[
                    {
                        icon: "SettingsIcon",
                        onPress: () => {
                            navigation.push("RAIN_CUSTOM_PAGE", {
                                title: "MaterialYou",
                                render: Settings,
                            });
                        },
                    },
                ]}
            />
        );
    }

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
                    await useThemes.getState().selectTheme(null);

                    if (!patches) {
                        showToast("Patches not loaded yet", findAssetId("CircleXIcon-primary"));
                        return;
                    }
                    try {
                        const theme = build(patches);
                        applyMonetTheme(theme);
                    } catch (e) {
                        showToast("Failed to build theme", findAssetId("CircleXIcon-primary"));
                    }
                }
                forceUpdate();
            }}
            actions={[
                {
                    icon: "SettingsIcon",
                    onPress: () => {
                        navigation.push("RAIN_CUSTOM_PAGE", {
                            title: "MaterialYou",
                            render: Settings,
                        });
                    },
                },
            ]}
        />
    );
}

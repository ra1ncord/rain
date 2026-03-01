import { findAssetId } from "@api/assets";
import { createStyles } from "@api/ui/styles";
import { semanticColors } from "@api/ui/components/color";
import { showToast } from "@api/ui/toasts";
import { LoggerClass } from "@lib/utils/logger";
import { React, ReactNative as RN } from "@metro/common";
import {
    Button,
    PressableScale,
    Stack,
    TableRow,
    TableRowGroup,
    Text,
} from "@metro/common/components";

import { useMonetSettings } from "./storage";
import { build, type BuiltTheme } from "./stuff/buildTheme";
import Color from "./components/Color";
import usePatches from "./hooks/usePatches";

import { applyMonetTheme, hasMonetTheme, setColorsFromDynamic, getMonetSysColors, refreshMonetSysColors } from "./index";
import type { VendettaSysColors } from "./types";

const logger = new LoggerClass("MonetTheme");

const useStyles = createStyles({
    pill: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        paddingHorizontal: 6,
        paddingVertical: 4,
        backgroundColor: semanticColors.BACKGROUND_MOD_SUBTLE,
        borderRadius: 8,
    },
    help: {
        width: 16,
        height: 16,
        tintColor: semanticColors.TEXT_BRAND,
        marginRight: 4,
    },
    labelIcon: {
        width: 14,
        height: 14,
        marginRight: 6,
        tintColor: semanticColors.TEXT_DEFAULT,
    },
});

export default function Settings() {
    const styles = useStyles();

    const colors = useMonetSettings((s: any) => s.colors);
    const patchConfig = useMonetSettings((s: any) => s.patches);
    const updateSettings = useMonetSettings((s: any) => s.updateSettings);

    const { patches, revalidate: revalidatePatches } = usePatches();

    const [isLoadedTheme, setIsLoadedTheme] = React.useState(hasMonetTheme());

    const [syscolors, setSyscolors] = React.useState<VendettaSysColors | null>(getMonetSysColors());
    const [sysColorsLoading, setSysColorsLoading] = React.useState(!syscolors);

    React.useEffect(() => {
        if (!syscolors) {
            refreshMonetSysColors().then(result => {
                if (result) setSyscolors(result);
                setSysColorsLoading(false);
            });
        } else {
            setSysColorsLoading(false);
        }
    }, []);

    let showMessage: string | undefined;
    if (RN.Platform.OS !== "android") {
        showMessage = "Dynamic colors are only available on Android.";
    } else if ((RN.Platform as any).Version < 31) {
        showMessage = "Dynamic colors are only available on Android 12+ (SDK 31+).";
    } else if (sysColorsLoading) {
        showMessage = undefined;
    } else if (!syscolors) {
        showMessage = "Dynamic colors are unavailable on this device.";
    }

    return (
        <RN.ScrollView style={{ flex: 1 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                {showMessage && (
                    <RN.View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <RN.Image
                            source={findAssetId("CircleInformationIcon-primary")}
                            style={styles.help}
                        />
                        <Text variant="text-md/semibold" color="TEXT_BRAND">
                            {showMessage}
                        </Text>
                    </RN.View>
                )}

                <TableRowGroup title="Colors">
                    <RN.View style={{ padding: 16, gap: 8 }}>
                        <RN.View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                            }}
                        >
                            {syscolors && (
                                <PressableScale
                                    style={styles.pill}
                                    onPress={() => {
                                        setColorsFromDynamic(syscolors, updateSettings);
                                        showToast(
                                            "Autofilled colors",
                                            findAssetId("PencilSparkleIcon"),
                                        );
                                    }}
                                >
                                    <RN.Image
                                        source={findAssetId("PencilSparkleIcon")}
                                        style={styles.labelIcon}
                                        resizeMode="cover"
                                    />
                                    <Text variant="text-sm/semibold" color="TEXT_DEFAULT">
                                        Autofill
                                    </Text>
                                </PressableScale>
                            )}
                        </RN.View>
                        <RN.View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Color
                                title="Neutral"
                                color={colors.neutral1}
                                update={(c: string) => updateSettings({ colors: { ...colors, neutral1: c } })}
                            />
                            <Color
                                title="Neutral variant"
                                color={colors.neutral2}
                                update={(c: string) => updateSettings({ colors: { ...colors, neutral2: c } })}
                            />
                            <Color
                                title="Primary"
                                color={colors.accent1}
                                update={(c: string) => updateSettings({ colors: { ...colors, accent1: c } })}
                            />
                            <Color
                                title="Secondary"
                                color={colors.accent2}
                                update={(c: string) => updateSettings({ colors: { ...colors, accent2: c } })}
                            />
                            <Color
                                title="Tertiary"
                                color={colors.accent3}
                                update={(c: string) => updateSettings({ colors: { ...colors, accent3: c } })}
                            />
                        </RN.View>
                    </RN.View>
                </TableRowGroup>

                {!patches ? (
                    <RN.ActivityIndicator size="small" />
                ) : (
                    <TableRowGroup title="Theme Actions">
                        <TableRow
                            label="Load Theme"
                            icon={<TableRow.Icon source={findAssetId("WrenchIcon")} />}
                            trailing={
                                <Button
                                    onPress={() => {
                                        applyMonetTheme(null);
                                        setIsLoadedTheme(false);
                                    }}
                                    disabled={!isLoadedTheme}
                                    size="sm"
                                    variant={isLoadedTheme ? "destructive" : "secondary"}
                                    icon={findAssetId("TrashIcon")}
                                    text=""
                                />
                            }
                            onPress={async () => {
                                let theme: BuiltTheme;
                                try {
                                    theme = build(patches);
                                } catch (e) {
                                    const err = e instanceof Error ? e : new Error(String(e));
                                    logger.error("Error during applying theme", err.stack);
                                    showToast(
                                        String(err),
                                        findAssetId("CircleXIcon-primary"),
                                    );
                                    return;
                                }

                                if (applyMonetTheme(theme)) setIsLoadedTheme(true);
                            }}
                        />
                        <TableRow
                            label="Reload Theme Patches"
                            subLabel={`Patch v${(patches as any).version ?? "?"} (${
                                patchConfig.from === "local"
                                    ? "from a local source"
                                    : "from GitHub"
                            })`}
                            icon={<TableRow.Icon source={findAssetId("ActivitiesIcon")} />}
                            onPress={revalidatePatches}
                        />
                    </TableRowGroup>
                )}
            </Stack>
        </RN.ScrollView>
    );
}

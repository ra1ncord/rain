import { getDebugInfo } from "@api/debug";
import { RainIcon } from "@assets";
import { Strings } from "@i18n";
import { Stack, TableRowGroup } from "@metro/common/components";
import { Platform, ScrollView } from "react-native";

import Version from "./Version";

export default function About() {
    const debugInfo = getDebugInfo();

    const versions = [
        {
            label: Strings.GENERAL.CORE.RAIN,
            version: debugInfo.rain.version,
            icon: { uri: RainIcon },
        },
        {
            label: Strings.GENERAL.CORE.DISCORD,
            version: `${debugInfo.discord.version} (${debugInfo.discord.build})`,
            icon: "Discord",
        },
        {
            label: Strings.GENERAL.CORE.REACT,
            version: debugInfo.react.version,
            icon: "ScienceIcon",
        },
        {
            label: Strings.GENERAL.CORE.REACT_NATIVE,
            version: debugInfo.react.nativeVersion,
            icon: "MobilePhoneIcon",
        },
        {
            label: Strings.GENERAL.CORE.HERMES_BYTECODE,
            version: debugInfo.hermes.bytecodeVersion,
            icon: "TopicsIcon",
        },
    ];

    const platformInfo = [
        {
            label: Strings.GENERAL.CORE.LOADER,
            version: `${debugInfo.rain.loader.name} (${debugInfo.rain.loader.version})`,
            icon: "DownloadIcon",
        },
        {
            label: Strings.GENERAL.CORE.OPERATING_SYSTEM,
            version: `${debugInfo.os.name} ${debugInfo.os.version}`,
            icon: "ScreenIcon"
        },
        ...(debugInfo.os.sdk ? [{
            label: Strings.GENERAL.CORE.SDK,
            version: debugInfo.os.sdk,
            icon: "StaffBadgeIcon"
        }] : []),
        {
            label: Strings.GENERAL.CORE.MANUFACTURER,
            version: debugInfo.device.manufacturer,
            icon: "WrenchIcon"
        },
        ...(Platform.OS !== "ios" ? [{
            label: Strings.GENERAL.CORE.BRAND,
            version: debugInfo.device.brand,
            icon: "MagicWandIcon"
        }] : []),
        {
            label: Strings.GENERAL.CORE.MODEL,
            version: debugInfo.device.model,
            icon: "MobilePhoneIcon"
        },
        {
            ...(Platform.OS === "ios" ? [{
                label: Strings.GENERAL.CORE.MODEL_ID,
                version: debugInfo.device.codename,
                icon: "TagIcon"
            }] : []),
        }
    ];

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title={Strings.GENERAL.CORE.VERSIONS}>
                    {versions.map(v => <Version label={v.label} version={v.version} icon={v.icon} />)}
                </TableRowGroup>
                <TableRowGroup title={Strings.GENERAL.CORE.PLATFORMS}>
                    {platformInfo.filter((p): p is typeof p & { version: string; icon: string } => p.version !== undefined && p.icon !== undefined).map(p => <Version key={p.label} label={p.label} version={p.version} icon={p.icon} />)}
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}

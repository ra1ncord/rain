import { getDebugInfo } from "@api/debug";
import { RainIcon } from "@assets";
import { Stack, TableRowGroup } from "@metro/common/components";
import { Platform, ScrollView } from "react-native";

import { Strings } from "@i18n";
import Version from "./Version";

export default function About() {
    const debugInfo = getDebugInfo();

    const versions = [
        {
            label: "Rain",
            version: debugInfo.rain.version,
            icon: { uri: RainIcon },
        },
        {
            label: Strings.DISCORD,
            version: `${debugInfo.discord.version} (${debugInfo.discord.build})`,
            icon: "Discord",
        },
        {
            label: Strings.REACT,
            version: debugInfo.react.version,
            icon: "ScienceIcon",
        },
        {
            label: Strings.REACT_NATIVE,
            version: debugInfo.react.nativeVersion,
            icon: "MobilePhoneIcon",
        },
        {
            label: Strings.HERMES_BYTECODE,
            version: debugInfo.hermes.bytecodeVersion,
            icon: "TopicsIcon",
        },
    ];

    const platformInfo = [
        {
            label: Strings.LOADER,
            version: `${debugInfo.rain.loader.name} (${debugInfo.rain.loader.version})`,
            icon: "DownloadIcon",
        },
        {
            label: Strings.OPERATING_SYSTEM,
            version: `${debugInfo.os.name} ${debugInfo.os.version}`,
            icon: "ScreenIcon"
        },
        ...(debugInfo.os.sdk ? [{
            label: Strings.SDK,
            version: debugInfo.os.sdk,
            icon: "StaffBadgeIcon"
        }] : []),
        {
            label: Strings.MANUFACTURER,
            version: debugInfo.device.manufacturer,
            icon: "WrenchIcon"
        },
        ...(Platform.OS !== "ios" ? [{
            label: Strings.BRAND,
            version: debugInfo.device.brand,
            icon: "MagicWandIcon"
        }] : []),
        {
            label: Strings.MODEL,
            version: debugInfo.device.model,
            icon: "MobilePhoneIcon"
        },
        {
            ...(Platform.OS === "ios" ? [{
                label: Strings.MODEL_ID,
                version: debugInfo.device.codename,
                icon: "TagIcon"
            }] : []),
        }
    ];

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 38 }}>
            <Stack style={{ paddingVertical: 24, paddingHorizontal: 12 }} spacing={24}>
                <TableRowGroup title={Strings.VERSIONS}>
                    {versions.map(v => <Version label={v.label} version={v.version} icon={v.icon} />)}
                </TableRowGroup>
                <TableRowGroup title={Strings.PLATFORMS}>
                    {platformInfo.filter((p): p is typeof p & { version: string; icon: string } => p.version !== undefined && p.icon !== undefined).map(p => <Version key={p.label} label={p.label} version={p.version} icon={p.icon} />)}
                </TableRowGroup>
            </Stack>
        </ScrollView>
    );
}

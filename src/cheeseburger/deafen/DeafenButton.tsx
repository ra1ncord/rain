import { findAssetId } from "@api/assets";
import { findByProps, findByStoreName } from "@metro";
import { React } from "@metro/common";
import { Image, Pressable, Text } from "react-native";

import { safe } from "../crash";
import { DEFAULT_ICON_SIZE, useCallLook } from "../look";
import { ToolbarButton } from "../toolbar";
import { useDeafenButtonSettings } from "./storage";

const firstAsset = (...names: string[]) => {
    for (const n of names) {
        const id = findAssetId(n);
        if (id !== undefined) return id;
    }
    return undefined;
};

const headphonesAsset = (deafened: boolean) => deafened
    ? firstAsset("HeadphonesDenyIcon", "HeadphonesSlashIcon", "HeadphonesXIcon", "ic_headset_deafen", "ic_deafen")
    : firstAsset("HeadphonesIcon", "ic_headset", "ic_headset_neutral");

export default function DeafenButton() {
    const { iconSize } = useDeafenButtonSettings();
    const look = useCallLook();
    const MediaEngineStore = findByStoreName("MediaEngineStore");
    const Flux = findByProps("useStateFromStores");
    const actions = findByProps("toggleSelfDeaf");

    const deafened: boolean = Flux?.useStateFromStores?.(
        [MediaEngineStore],
        () => !!MediaEngineStore?.isSelfDeaf?.(),
    ) ?? false;

    const onPress = React.useMemo(() => safe("deafen press", () => actions?.toggleSelfDeaf?.()), [actions]);
    const icon = headphonesAsset(deafened);
    const custom = Number(iconSize);
    const d = custom && custom !== DEFAULT_ICON_SIZE ? custom : look.size;
    const color = deafened ? "#f23f43" : look.tint;

    const plain = (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={deafened ? "Undeafen" : "Deafen"}
            onPress={onPress}
            hitSlop={12}
            style={({ pressed }) => ({
                minWidth: 48,
                height: 48,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.5 : 1,
            })}
        >
            {icon !== undefined
                ? <Image source={icon} style={{ width: d, height: d, tintColor: color }} />
                : <Text style={{ fontSize: d * 0.9, color }}>{deafened ? "🔇" : "🎧"}</Text>}
        </Pressable>
    );

    return (
        <ToolbarButton
            icon={deafened ? ["HeadphonesSlashIcon", "HeadphonesDenyIcon", "HeadphonesXIcon"] : ["HeadphonesIcon"]}
            label={deafened ? "Undeafen" : "Deafen"}
            onPress={onPress}
            color={deafened ? "#f23f43" : undefined}
            fallback={plain}
        />
    );
}

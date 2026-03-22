import { showToast } from "@api/ui/toasts";
import { findByProps } from "@metro";
import { ReactNative as RN } from "@metro/common";
import React from "react";

import { Emojis } from "../../modules";

const { TableRow: TR } = findByProps("TableRow");

export default function AddToServerRow({ guild, emoji, emojiName }: { guild: any, emoji: any, emojiName: string }) {
    const emojiSlotModule = findByProps("getMaxEmojiSlots");
    const EmojiStore = findByProps("getGuilds");

    const [isLoading, setIsLoading] = React.useState(false);

    const isSlotsUnknown = React.useRef(false);
    const slotsAvailable = React.useMemo(() => {
        let maxSlots = guild.getMaxEmojiSlots?.() ?? emojiSlotModule?.getMaxEmojiSlots?.(guild);
        if (!maxSlots) {
            if (!isSlotsUnknown.current) {
                isSlotsUnknown.current = true;
                showToast("Failed to check max emoji slots");
            }
            maxSlots = 250;
        }
        const guildEmojis = EmojiStore?.getGuilds?.()[guild.id]?.emojis ?? [];
        const isAnimated = emoji.src?.includes?.(".gif");
        return guildEmojis.filter((e: any) => e?.animated === isAnimated).length < maxSlots;
    }, [guild, emoji]);

    const handleAddToServer = async () => {
        if (!emojiName || isLoading || !slotsAvailable) return;
        setIsLoading(true);
        try {
            const response = await fetch(emoji.src);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64data = reader.result as string;
                try {
                    await Emojis.uploadEmoji({
                        guildId: guild.id,
                        image: base64data,
                        name: emojiName,
                        roles: undefined
                    });
                    showToast(`Added ${emojiName} to ${guild.name}`);
                } catch (err: any) {
                    showToast("Failed to add emoji: " + (typeof err === "object" && err && "message" in err ? err.message : String(err)));
                } finally {
                    setIsLoading(false);
                }
            };
        } catch (e) {
            showToast("Failed to add emoji");
            setIsLoading(false);
        }
    };

    return (
        <TR
            disabled={!slotsAvailable}
            label={guild.name}
            subLabel={!slotsAvailable ? "No slots available" : isSlotsUnknown.current ? "Failed to check max emoji slots" : undefined}
            icon={
                guild.icon ? (
                    <RN.Image
                        source={{ uri: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64` }}
                        style={{ width: 40, height: 40, borderRadius: 8 }}
                    />
                ) : (
                    <RN.View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: "#5865F2", alignItems: "center", justifyContent: "center" }}>
                        <RN.Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>{guild.acronym}</RN.Text>
                    </RN.View>
                )
            }
            onPress={handleAddToServer}
        />
    );
}

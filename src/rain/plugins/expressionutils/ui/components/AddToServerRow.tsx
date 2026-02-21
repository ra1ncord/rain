import { findAssetId } from "@api/assets";
import { showToast } from "@api/ui/toasts";
import { lazyDestructure } from "@lib/utils/lazy";
import { findByProps } from "@metro";
import { ReactNative as RN } from "@metro/common";
import { Forms, Stack, TextInput } from "@metro/common/components";
import React from "react";
import { Emojis } from "../../modules";

const { FormRow } = Forms;
const { TableRowGroup } = findByProps("TableRow");

const { openAlert } = lazyDestructure(() => findByProps("openAlert", "dismissAlert"));
const { AlertModal, AlertActionButton } = lazyDestructure(() => findByProps("AlertModal", "AlertActions"));

export default function AddToServerRow({ guild, emoji }: { guild: any, emoji: any }) {
    const emojiSlotModule = findByProps("getMaxEmojiSlots");
    const EmojiStore = findByProps("getGuilds");

    const [emojiName, setEmojiName] = React.useState(emoji.name);

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

    const addToServerCallback = () => {
        openAlert(`add-emoji-${guild.id}-${emoji.id}`, <AlertModal
            title="Emoji name"
            extraContent={
                <RN.View style={{ paddingTop: 10 }}>
                    <TextInput
                        autoFocus
                        size="md"
                        value={emojiName}
                        onChange={setEmojiName}
                        placeholder="Emoji name"
                    />
                </RN.View>
            }
            actions={
                <Stack>
                    <AlertActionButton text={`Add to ${guild.name}`} variant="primary" disabled={!emojiName} onPress={async () => {
                        if (!emojiName) return;
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
                                    showToast(`Added ${emoji.name}${emoji.name !== emojiName ? ` as ${emojiName}` : ""} to ${guild.name}`);
                                } catch (err: any) {
                                    showToast("Failed to add emoji: " + (typeof err === "object" && err && "message" in err ? err.message : String(err)));
                                }
                            };
                        } catch (e) {
                            showToast("Failed to add emoji");
                        }
                    }} />
                    <AlertActionButton text="Cancel" variant="secondary" />
                </Stack>
            }
        />);
    };

    return (
        <TableRowGroup>
            <FormRow
                leading={
                    guild.icon ? (
                        <RN.Image
                            source={{ uri: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64` }}
                            style={{ width: 32, height: 32, borderRadius: 8 }}
                        />
                    ) : (
                        <RN.View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#5865F2", alignItems: "center", justifyContent: "center" }}>
                            <RN.Text style={{ color: "#fff", fontSize: 14, fontWeight: "bold" }}>{guild.acronym}</RN.Text>
                        </RN.View>
                    )
                }
                disabled={!slotsAvailable}
                label={guild.name}
                subLabel={!slotsAvailable ? "No slots available" : isSlotsUnknown.current ? "Failed to check max emoji slots" : undefined}
                trailing={
                    <Forms.FormIcon
                        style={{ opacity: 1 }}
                        source={findAssetId("ic_add_24px")}
                    />
                }
                onPress={addToServerCallback}
            />
        </TableRowGroup>
    );
}

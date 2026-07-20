import { registerCommand } from "@api/commands";
import { ApplicationCommandOptionType, RainApplicationCommand } from "@api/commands/types";
import { NativeFileModule } from "@api/native/modules";
import { logger } from "@lib/utils/logger";
import { findByProps } from "@metro";
import { UserStore } from "@metro/common/stores";
import { definePlugin } from "@plugins";
import { Contributors, Developers } from "@rain/Developers";

let unregister: (() => void) | undefined;

function getApiBase(): string {
    try {
        let base = findByProps("getAPIBaseURL", "del")?.getAPIBaseURL?.();
        if (typeof base === "string") {
            if (base.startsWith("//")) base = `https:${base}`;
            if (base.startsWith("http") && base.includes("/api/")) return base;
        }
    } catch {}
    return "https://discord.com/api/v9";
}

async function fetchPetPetBase64(avatarUrl: string): Promise<string> {
    const endpoint = `https://api.popcat.xyz/pet?image=${encodeURIComponent(avatarUrl)}`;
    const response = await fetch(endpoint);

    if (!response.ok) {
        throw new Error(`Failed to fetch petpet GIF: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
}

async function sendPetPetAttachment(channelId: string, base64Data: string): Promise<void> {
    const filename = "petpet.gif";
    const tempPath = `rain/petpet/${Date.now()}-${Math.random().toString(16).slice(2)}.gif`;

    const filePath = await NativeFileModule.writeFile("cache", tempPath, base64Data, "base64");
    const uri = String(filePath).startsWith("file://") ? String(filePath) : `file://${filePath}`;

    const token = findByProps("getToken")?.getToken?.();
    if (!token) throw new Error("Unable to resolve authorization token.");

    const form = new FormData();
    form.append(
        "payload_json",
        JSON.stringify({
            content: "",
            channel_id: channelId,
            type: 0,
            attachments: [{ id: "0", filename }],
            nonce: Date.now().toString(),
        })
    );
    form.append("files[0]", { uri, type: "image/gif", name: filename } as any);

    try {
        const response = await fetch(`${getApiBase()}/channels/${channelId}/messages`, {
            method: "POST",
            headers: { Authorization: token },
            body: form,
        });

        if (!response.ok) {
            throw new Error(`Discord REST API returned ${response.status}`);
        }
    } finally {
        setTimeout(() => {
            try {
                NativeFileModule.removeFile("cache", tempPath);
            } catch {}
        }, 5000);
    }
}

export default definePlugin({
    name: "PetPet",
    description: "Send a GIF of someone being pet",
    author: [Contributors.wolfie, Developers.cocobo1],
    id: "petpet",
    version: "2.0.0",
    start() {
        unregister = registerCommand(petPetCommand());
    },
    stop() {
        unregister?.();
    },
});

const petPetCommand = (): RainApplicationCommand => ({
    name: "petpet",
    displayName: "petpet",
    description: "PetPet someone",
    displayDescription: "PetPet someone",
    applicationId: "-1",
    inputType: 1,
    type: 1,
    shouldHide: () => false,
    options: [
        {
            name: "user",
            description: "The user (or their id) to be patted",
            type: ApplicationCommandOptionType.USER,
            required: true,
            displayName: "user",
            displayDescription: "The user (or their id) to be patted",
        },
    ],
    execute: async (args, ctx) => {
        try {
            const user = await UserStore.getUser(args[0].value);
            const avatarUrl = user.getAvatarURL(128).replace(".webp", ".png");

            const base64Gif = await fetchPetPetBase64(avatarUrl);

            await sendPetPetAttachment(ctx.channel.id, base64Gif);
        } catch (error) {
            logger.error("[PetPet] Error executing command:", error);
        }
    },
});

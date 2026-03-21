import { registerCommand } from "@api/commands";
import { ApplicationCommandOptionType, RainApplicationCommand } from "@api/commands/types";
import { findByProps, findByStoreName } from "@metro";
import { definePlugin } from "@plugins";

const UserStore = findByStoreName("UserStore");
const MessageActions = findByProps("sendMessage");

const getPetPetData = async (image: string) => {
    const data = await fetch(
        `https://api.obamabot.me/v2/image/petpet?image=${image.replace("webp", "png")}`,
    );
    const body = await data.json();
    return body;
};

export default definePlugin({
    name: "PetPet",
    description: "Send a gif of someone being pet",
    author: [{name: "Vendicated", id: 343383572805058560n}],
    id: "petpet",
    version: "1.0.0",
    start() {
        unregister = registerCommand(petPetCommand());
    },
    stop() {
        unregister?.();
    }
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
            description: "The user(or their id) to be patted",
            type: ApplicationCommandOptionType.USER,
            required: true,
            displayName: "user",
            displayDescription: "The user(or their id) to be patted",
        },
    ],
    execute: async (args, ctx) => {
        try {
            const user = await UserStore.getUser(args[0].value);
            const image = user.getAvatarURL(512);
            const data = await getPetPetData(image);
            const fixNonce = Date.now().toString();
            MessageActions.sendMessage(
                ctx.channel.id,
                { content: data.url },
                void 0,
                { nonce: fixNonce }
            );
        } catch (error) {
        }
    },
});

let unregister: (() => void) | undefined;

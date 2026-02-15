import { findByProps, findByStoreName } from "@metro";

import { getPetPetData } from "../utils/api";

const UserStore = findByStoreName("UserStore");
const MessageActions = findByProps("sendMessage");

export const petPetCommand = {
    name: "petpet",
    displayName: "petpet",
    description: "PetPet someone",
    displayDescription: "PetPet someone",
    options: [
        {
            name: "user",
            description: "The user(or their id) to be patted",
            type: 6,
            required: true,
            displayName: "user",
            displayDescription: "The user(or their id) to be patted",
        },
    ],
    execute: async (args: any, ctx: any) => {
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
            return null;
        } catch (error) {
            console.error("[PetPet] Error:", error);
            // Silent fail
            return null;
        }
    },
    applicationId: "-1",
    inputType: 1,
    type: 1,
};

import { registerCommand } from "@api/commands";
import { ApplicationCommandOptionType, RainApplicationCommand } from "@api/commands/types";
import { findByProps, findByStoreName } from "@metro";
import { definePlugin } from "@plugins";
import { Contributors } from "@rain/Developers";
import { Strings } from "@rain/i18n";

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
    name: Strings.PLUGINS.CUSTOM.PETPET.NAME,
    description: Strings.PLUGINS.CUSTOM.PETPET.DESCRIPTION,
    author: [Contributors.Vendicated],
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
    name: Strings.PLUGINS.CUSTOM.PETPET.COMMAND_NAME,
    displayName: Strings.PLUGINS.CUSTOM.PETPET.COMMAND_NAME,
    description: Strings.PLUGINS.CUSTOM.PETPET.COMMAND_DESC,
    displayDescription: Strings.PLUGINS.CUSTOM.PETPET.COMMAND_DESC,
    applicationId: "-1",
    inputType: 1,
    type: 1,
    shouldHide: () => false,
    options: [
        {
            name: Strings.PLUGINS.CUSTOM.PETPET.USER,
            description: Strings.PLUGINS.CUSTOM.PETPET.USER_DESC,
            type: ApplicationCommandOptionType.USER,
            required: true,
            displayName: Strings.PLUGINS.CUSTOM.PETPET.USER,
            displayDescription: Strings.PLUGINS.CUSTOM.PETPET.USER_DESC,
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

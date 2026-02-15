import { registerCommand } from "@api/commands";
import { definePlugin } from "@plugins";

import settings from "./settings/settings";
import { catFactCommand, dogFactCommand, uselessFactCommand } from "./src/commands/facts";
import { firstMessageCommand } from "./src/commands/firstmessage";
import { friendInviteCreateCommand, friendInviteRevokeCommand,friendInviteViewCommand } from "./src/commands/friendinvites";
import { garyCommand } from "./src/commands/gary";
import { ipCommand } from "./src/commands/ip";
import { konoSelfCommand, konoSendCommand } from "./src/commands/konochan";
import { pluginListCommand, themeListCommand } from "./src/commands/lists";
import { lovefemboysCommand } from "./src/commands/lovefemboys";
import { nekoslifeCommand } from "./src/commands/nekoslife";
import { petPetCommand } from "./src/commands/petpet";
import { spotifyAlbumCommand, spotifyArtistsCommand, spotifyCoverCommand,spotifyTrackCommand } from "./src/commands/spotify";
import { sysinfoCommand } from "./src/commands/sysinfo";
import { storage } from "./storage";

const commandMap = {
    catfact: catFactCommand,
    dogfact: dogFactCommand,
    useless: uselessFactCommand,
    petpet: petPetCommand,
    pluginList: pluginListCommand,
    themeList: themeListCommand,
    konoself: konoSelfCommand,
    konosend: konoSendCommand,
    firstmessage: firstMessageCommand,
    sysinfo: sysinfoCommand,
    spotifyTrack: spotifyTrackCommand,
    spotifyAlbum: spotifyAlbumCommand,
    spotifyArtists: spotifyArtistsCommand,
    spotifyCover: spotifyCoverCommand,
    gary: garyCommand,
    ip: ipCommand,
    lovefemboys: lovefemboysCommand,
    nekoslife: nekoslifeCommand,
    friendInviteCreate: friendInviteCreateCommand,
    friendInviteView: friendInviteViewCommand,
    friendInviteRevoke: friendInviteRevokeCommand,
};

let commands: Array<() => void> = [];

export default definePlugin({
    name: "MoreCommands",
    description: "Additional commands for Discord",
    author: [{ name: "kmmiio99o", id: 879393496627306587n }],
    id: "morecommands",
    version: "v1.0.0",
    start() {

        // Register commands
        for (const [key, command] of Object.entries(commandMap)) {
            if (storage.enabledCommands[key]) {
                try {
                    commands.push(registerCommand(command as any));
                } catch (error) {
                    console.error(
                        `[Commands Plugin] Failed to register command ${key}:`,
                        error,
                    );
                }
            }
        }
    },
    stop() {

        // Unregister commands
        commands.forEach((unregister) => {
            try {
                unregister();
            } catch (error) {
                // Ignore errors during cleanup
            }
        });
        commands = [];
    },
    settings,
});

import { definePlugin } from "@plugins";
import { patchCommands, registerCommand } from "@api/commands";
import { storage } from "./storage";
import { catFactCommand, dogFactCommand, uselessFactCommand } from "./src/commands/facts";
import { pluginListCommand, themeListCommand } from "./src/commands/lists";
import { petPetCommand } from "./src/commands/petpet";
import { konoSelfCommand, konoSendCommand } from "./src/commands/konochan";
import { firstMessageCommand } from "./src/commands/firstmessage";
import { sysinfoCommand } from "./src/commands/sysinfo";
import { spotifyTrackCommand, spotifyAlbumCommand, spotifyArtistsCommand, spotifyCoverCommand } from "./src/commands/spotify";
import { garyCommand } from "./src/commands/gary";
import { lovefemboysCommand } from "./src/commands/lovefemboys";
import { ipCommand } from "./src/commands/ip";
import { nekoslifeCommand } from "./src/commands/nekoslife";
import { friendInviteCreateCommand, friendInviteViewCommand, friendInviteRevokeCommand } from "./src/commands/friendinvites";
import settings from "./settings/settings";

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
  name: "morecommands",
  description: "Additional commands for Discord",
  author: [{ name: "kmmiio99o", id: 879393496627306587n }],
  id: "morecommands",
  version: "v1.0.0",
  start() {
    console.log("[Commands Plugin] Loading...");

    // Patch commands to allow registering custom commands
    patchCommands();

    // Register commands
    for (const [key, command] of Object.entries(commandMap)) {
      if (storage.enabledCommands[key]) {
        try {
          commands.push(registerCommand(command as any));
          console.log(`[Commands Plugin] Registered command: ${key}`);
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
    console.log("[Commands Plugin] Unloading...");

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

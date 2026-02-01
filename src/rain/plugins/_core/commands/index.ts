import { definePlugin } from "@plugins";
import { registerCommand, patchCommands } from "@api/commands";

export default definePlugin({
    name: "Commands",
    description: "Provides core commands",
    author: [{ name: "cocobo1", id: 767650984175992833n }],
    id: "commands",
    version: "v1.0.0",
    start() {
        patchCommands();
        [require("./builtins/debug")].forEach(r => registerCommand(r.default()));
    }
});
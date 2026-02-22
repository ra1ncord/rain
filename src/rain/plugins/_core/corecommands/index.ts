import { patchCommands,registerCommand } from "@api/commands";
import { definePlugin } from "@plugins";

export default definePlugin({
    name: "CoreCommands",
    description: "Provides core commands",
    author: [{ name: "cocobo1", id: 767650984175992833n }],
    // this is still the id as we automatically add core. to core plugins
    id: "commands",
    version: "1.0.0",
    start() {
        patchCommands();
        [require("./builtins/debug"), require("./builtins/plugins"), require("./builtins/themes")].forEach(r => registerCommand(r.default()));
    }
});

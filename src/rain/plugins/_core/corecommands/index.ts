import { patchCommands,registerCommand } from "@api/commands";
import { definePlugin } from "@plugins";
import { Strings } from "@rain/i18n";

export default definePlugin({
    name: Strings.PLUGIN__CORE_COMMANDS,
    description: Strings.PLUGIN__CORE_COMMANDS_DESC,
    author: [{ name: "cocobo1", id: 767650984175992833n }],
    // this is still the id as we automatically add "core." to core plugins
    id: "commands",
    version: "v1.0.0",
    start() {
        patchCommands();
        [require("./builtins/debug"), require("./builtins/plugins"), require("./builtins/themes")].forEach(r => registerCommand(r.default()));
    }
});

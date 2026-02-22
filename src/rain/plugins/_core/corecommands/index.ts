import { patchCommands,registerCommand } from "@api/commands";
import { definePlugin } from "@plugins";
import { Strings } from "@rain/i18n";
import {Developers} from "@rain/Developers";

export default definePlugin({
    name: Strings.PLUGIN__CORE_COMMANDS,
    description: Strings.PLUGIN__CORE_COMMANDS_DESC,
    author: [Developers.cocobo1],
    // this is still the id as we automatically add "core." to core plugins
    id: "commands",
    version: "1.0.0",
    start() {
        patchCommands();
        [require("./builtins/debug"), require("./builtins/plugins"), require("./builtins/themes")].forEach(r => registerCommand(r.default()));
    }
});

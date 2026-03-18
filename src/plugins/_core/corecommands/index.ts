import { patchCommands,registerCommand } from "@api/commands";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";
import { Strings } from "@rain/i18n";

export default definePlugin({
    name: Strings.PLUGINS.CORE.CORECOMMANDS.NAME,
    description: Strings.PLUGINS.CORE.CORECOMMANDS.DESCRIPTION,
    author: [Developers.cocobo1],
    // this is still the id as we automatically add "core." to core plugins
    id: "commands",
    version: "1.0.0",
    start() {
        patchCommands();
        [require("./builtins/debug"), require("./builtins/plugins"), require("./builtins/themes")].forEach(r => registerCommand(r.default()));
    }
});

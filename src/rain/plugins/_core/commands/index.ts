import { after, instead } from "@api/patcher";
import { commands as commandsModule, messageUtil } from "@metro/common";
import { definePlugin } from "@plugins";
import { registerCommand } from "@api/commands";
import { ApplicationCommand } from "@api/commands/types";

export default definePlugin({
    name: "Commands",
    description: "Allows you to use custom commands",
    author: [{ name: "cocobo1", id: 767650984175992833n }],
    id: "commands",
    version: "v1.0.0",
    start() {
        patchCommands();
    }
});

let commands: ApplicationCommand[] = [];

/**
 * @internal
 */
export function patchCommands() {
    const unpatch = after("getBuiltInCommands", commandsModule, ([type], res: ApplicationCommand[]) => {
        return [...res, ...commands.filter(c =>
            (type instanceof Array ? type.includes(c.type) : type === c.type)
            && c.__rain?.shouldHide?.() !== false)
        ];
    });

    [
        require("./builtins/debug")
    ].forEach(r => registerCommand(r.default()));

    return () => {
        commands = [];
        unpatch();
    };
}
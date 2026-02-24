import { ApplicationCommand } from "@api/commands/types";
import { messageUtil } from "@metro/common";
import unifyRainPlugin from "@rain/pages/Plugins/models/rain";
import { pluginInstances } from "@plugins";

// todo: i18n
export default () => <ApplicationCommand>{
    name: "plugins",
    description: "Send your plugin info to the current channel",
    execute([ephemeral], ctx) {
        const rainPlugins = [...pluginInstances.values()];
        const plugins = rainPlugins.map(plugin => unifyRainPlugin(plugin));
        const enabled = plugins.filter(p => p.isEnabled() && !p.isCore()).map(p => p.name);

        const content = [
            ...(enabled.length > 0 ? [
                `Enabled Plugins (${enabled.length}):`,
                "> " + enabled.join(", "),
            ] : []),
            ...(enabled.length < 1 ? [
                "> No plugins in use"
            ] : []),
        ].join("\n");

        if (ephemeral?.value) {
            messageUtil.sendBotMessage(ctx.channel.id, content);
        } else {
            const fixNonce = Date.now().toString();
            messageUtil.sendMessage(ctx.channel.id, { content }, void 0, { nonce:fixNonce });
        }
    }
};

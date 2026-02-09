import { messageUtil } from "@metro/common";
import { ApplicationCommand } from "@api/commands/types";
import { isPluginEnabled, pluginInstances } from "@rain/plugins";
import { UnifiedPluginModel } from "@rain/pages/Plugins/models";
import unifyRainPlugin from "@rain/pages/Plugins/models/rain";

// todo: i18n
export default () => <ApplicationCommand>{
    name: "plugins",
    description: "Send your plugin info to the current channel",
    execute([ephemeral], ctx) {
        const rainPlugins = [...pluginInstances.values()];
        let plugins = rainPlugins.map(plugin => unifyRainPlugin(plugin));
        const enabled = plugins.filter(p => p.isEnabled() && !p.isCore()).map(p => p.name);

        const content = [
            "Rain Plugins: ",
            ...(enabled.length > 0 ? [
                `Enabled (${enabled.length}):`,
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

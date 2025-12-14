import { ApplicationCommand, ApplicationCommandOptionType } from "@plugins/_core/commands/types";
import { getDebugInfo } from "@lib/api/debug";
import { messageUtil } from "@metro/common";

// todo: i18n
export default () => <ApplicationCommand>{
    name: "debug",
    description: "Send debug info about rain to the current channel",
    execute([ephemeral], ctx) {
        const info = getDebugInfo();
        const content = [
            "**Rain Debug Info**",
            `> Rain: ${info.rain.version} (${info.rain.loader.name} ${info.rain.loader.version})`,
            `> Bunny Compatibility: ${info.bunny.version}`,
            `> Discord: ${info.discord.version} (${info.discord.build})`,
            `> React: ${info.react.version} (RN ${info.react.nativeVersion})`,
            `> Hermes: ${info.hermes.version} (bcv${info.hermes.bytecodeVersion})`,
            `> System: ${info.os.name} ${info.os.version} ${info.os.sdk ? `(SDK ${info.os.sdk})` : ""}`.trimEnd(),
            `> Device: ${info.device.model} (${info.device?.codename})`,
        ].join("\n");

        if (ephemeral?.value) {
            messageUtil.sendBotMessage(ctx.channel.id, content);
        } else {
            const fixNonce = Date.now().toString();
            messageUtil.sendMessage(ctx.channel.id, { content }, void 0, {nonce:fixNonce});
        }
    }
};

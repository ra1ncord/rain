import { ApplicationCommand } from "@api/commands/types";
import { messageUtil } from "@metro/common";
import { themes } from "@plugins/_core/painter/themes";

const addonAuthors = (authors: any): string => {
    if (!authors) return "Unknown";
    if (!Array.isArray(authors)) return "Unknown";
    if (authors.length === 0) return "Unknown";

    return authors
        .filter((author: any) => author && (typeof author === "string" || (typeof author === "object" && author.name)))
        .map((author: any) => typeof author === "string" ? author : (author.name || "Unknown"))
        .join("; ") || "Unknown";
};

export default (): ApplicationCommand => <ApplicationCommand>{
    name: "themes",
    description: "Send your theme list to the current channel",
    options: [],
    execute([ephemeral], ctx) {
        if (!themes || typeof themes !== "object") {
            messageUtil.sendBotMessage(ctx.channel.id, "No themes found or themes not loaded yet.");
            return;
        }

        const themeList = [...Object.values(themes)];
        const enabledThemes = themeList.filter((t: any) => t && t.selected);
        const disabledThemes = themeList.filter((t: any) => t && !t.selected);

        const formatThemes = (themes: any[]) => themes
            .filter(t => t && typeof t === "object")
            .map((t: any) => {
                const { data } = t;
                const name = data?.name || "Unknown Theme";
                const authors = addonAuthors(data?.authors);
                return `${name} by ${authors}`;
            })
            .join(", ");

        const content = [
            ...(enabledThemes.length > 0 ? [
                `Enabled Themes (${enabledThemes.length}):`,
                "> " + formatThemes(enabledThemes),
            ] : []),
            ...(disabledThemes.length > 0 ? [
                `Disabled Themes (${disabledThemes.length}):`,
                "> " + formatThemes(disabledThemes),
            ] : []),
            ...(themeList.length === 0 ? [
                "> No themes in use"
            ] : []),
        ].join("\n");

        if (ephemeral?.value) {
            messageUtil.sendBotMessage(ctx.channel.id, content);
        } else {
            const fixNonce = Date.now().toString();
            messageUtil.sendMessage(ctx.channel.id, { content }, void 0, { nonce: fixNonce });
        }
    }
};

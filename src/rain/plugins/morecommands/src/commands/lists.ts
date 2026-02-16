import { showConfirmationAlert } from "@api/ui/alerts";
import { findByProps, findByStoreName } from "@metro";
import { pluginInstances, usePluginSettings, isPluginEnabled } from "@plugins";
import { themes } from "@plugins/_core/painter/themes";

import { storage } from "../../storage";

const ALERT = {
    CONTENT: "This list is over 2000 characters. Send anyway?",
    CONFIRM: "Send",
    CANCEL: "Cancel"
};

const ARGS = {
    DETAILED: "detailed"
};

const EMPTY = "";

// TODO: when split large messages plugin will be implemented, fix usage of this
const FAILED_TO_SEND_LIST = {
    SLM_NOT_INSTALLED: "This list is over 2000 characters. Enable the Split Large Messages plugin to send it.",
};

const JOINERS = {
    SEMICOL: "; ",
    NEW_LINE: "\n"
};

const NOTHING_TO_SEE = "Nothing to see here, huh...";

const SPLIT_LARGE_MESSAGES_PLUGIN = "github.com/fres621/vendetta-plugins";

const STATUS = {
    ENABLED: "✅",
    DISABLED: "❌",
    SELECTED: "✅",
    NOT_SELECTED: "❌"
};

const MessageActions = findByProps("sendMessage", "receiveMessage");
const Clyde = findByProps("sendBotMessage");

const maxMessageLength = (() => {
    try {
        return findByStoreName("UserStore")
            .getCurrentUser()
            ?.premiumType === 2
            ? 4000
            : 2000;
    } catch (e) {
        return 2000; // fallback
    }
})();

const isSLMPluginInstalled = (installedPlugins: Map<string, any>) =>
    Array.from(installedPlugins.keys())
        .includes(SPLIT_LARGE_MESSAGES_PLUGIN);

const isSLMPluginEnabled = (installedPlugins: Map<string, any>) =>
    Array.from(installedPlugins.values())
        .find(plugin => plugin.id === SPLIT_LARGE_MESSAGES_PLUGIN)
        ?.enabled;

const getArgumentValue = (args: any[]): any | false =>
    args
        .find(arg => arg.name === ARGS.DETAILED)
        ?.value ?? false;

const addonAuthors = (authors: any) => {
    if (!authors) return "Unknown";
    if (!Array.isArray(authors)) return "Unknown";
    if (authors.length === 0) return "Unknown";

    return authors
        .filter(author => author && (typeof author === "string" || (typeof author === "object" && author.name)))
        .map(author => typeof author === "string" ? author : (author.name || "Unknown"))
        .join(JOINERS.SEMICOL) || "Unknown";
};

const formatList = (list: string[]) =>
    list
        .join(JOINERS.NEW_LINE)
        .trimEnd();

const getListLength = (list: string[]) => formatList(list).length;

const sendList = async (channelID: string, list: string[]) => {
    const fixNonce = Date.now().toString();
    await MessageActions.sendMessage(channelID, {
        content: formatList(list)
    }, void 0, { nonce: fixNonce });
};

const baseListHeader = (type: "Plugin" | "Theme", length: number) => [
    `**My ${type} List | ${length} ${type}s**`,
    EMPTY
];

export async function themeList(args: any[], ctx: any) {
    try {
        const detailed = getArgumentValue(args);
        const alwaysDetailed = storage.themeListAlwaysDetailed ?? false;

        // Ensure themes is valid
        if (!themes || typeof themes !== "object") {
            const channelID: string = ctx.channel.id;
            Clyde.sendBotMessage(channelID, "No themes found or themes not loaded yet.");
            return null;
        }

        const objectValues = Object.values(themes);

        const channelID: string = ctx.channel.id;

        const themeList = baseListHeader("Theme", Object.keys(themes).length);

        if (objectValues.length) {
            for (const theme of objectValues) {
                if (!theme || typeof theme !== "object") continue;

                const { selected, data, id } = theme;

                // Safe destructuring with fallbacks
                const name = data?.name || "Unknown Theme";
                const description = data?.description || "No description";
                const authors = data?.authors;

                if (detailed || alwaysDetailed)
                    themeList.push(
                        `> **Name**: ${name}`,
                        `> **Selected**: ${selected ? STATUS.SELECTED : STATUS.NOT_SELECTED}`,
                        `> **Description**: ${description}`,
                        `> **Authors**: ${addonAuthors(authors)}`,
                        `> **[Install!](${id || "unknown"})**`,
                        EMPTY
                    );
                else
                    themeList.push(`> ${selected ? STATUS.SELECTED : STATUS.NOT_SELECTED} **${name}** by ${addonAuthors(authors)}`);
            }
        } else
            themeList.push(NOTHING_TO_SEE);

        const isListTooLong = getListLength(themeList) > maxMessageLength;

        if (isListTooLong && !isSLMPluginInstalled(pluginInstances))
            Clyde.sendBotMessage(channelID, FAILED_TO_SEND_LIST.SLM_NOT_INSTALLED);
        else {
            if (getListLength(themeList) > 2000)
                return showConfirmationAlert({
                    content: ALERT.CONTENT,
                    confirmText: ALERT.CONFIRM,
                    cancelText: ALERT.CANCEL,
                    onConfirm: async () => await sendList(channelID, themeList)
                });

            await sendList(channelID, themeList);
        }
    } catch (error) {
        console.error("[ThemeList] Error:", error);
        return null;
    }
}

export async function pluginList(args: any[], ctx: any) {
    try {
        const detailed = getArgumentValue(args);
        const alwaysDetailed = storage.pluginListAlwaysDetailed ?? false;

        const channelID: string = ctx.channel.id;

        // Ensure pluginInstances is valid
        if (!pluginInstances || typeof pluginInstances !== "object") {
            Clyde.sendBotMessage(channelID, "No plugins found or plugins not loaded yet.");
            return null;
        }

        const pluginList = baseListHeader("Plugin", pluginInstances.size);

        for (const [id, plugin] of pluginInstances) {
            if (!plugin || typeof plugin !== "object") continue;

            const enabled = isPluginEnabled(id);
            const name = plugin.name || "Unknown Plugin";
            const description = plugin.description || "No description";
            const authors = plugin.author;

            if (detailed || alwaysDetailed)
                pluginList.push(
                    `> **Name**: ${name}`,
                    `> **Status**: ${enabled ? STATUS.ENABLED : STATUS.DISABLED}`,
                    `> **Description**: ${description}`,
                    `> **Authors**: ${addonAuthors(authors)}`,
                    EMPTY
                );
            else
                pluginList.push(`> ${enabled ? STATUS.ENABLED : STATUS.DISABLED} **${name}** by ${addonAuthors(authors)}`);
        }

        const isListTooLong = getListLength(pluginList) > maxMessageLength;

        if (isListTooLong && !isSLMPluginInstalled(pluginInstances))
            Clyde.sendBotMessage(channelID, FAILED_TO_SEND_LIST.SLM_NOT_INSTALLED);
        else {
            if (getListLength(pluginList) > 2000)
                return showConfirmationAlert({
                    content: ALERT.CONTENT,
                    confirmText: ALERT.CONFIRM,
                    cancelText: ALERT.CANCEL,
                    onConfirm: async () => await sendList(channelID, pluginList)
                });

            await sendList(channelID, pluginList);
        }
    } catch (error) {
        console.error("[PluginList] Error:", error);
        return null;
    }
}

// Export commands for your existing structure
export const pluginListCommand = {
    name: "plugin-list",
    displayName: "plugin list",
    description: "Send your plugin list to the current channel",
    displayDescription: "Send your plugin list to the current channel",
    options: [
        {
            name: "detailed",
            description: "Whether to send a list with detailed information.",
            type: 5,
            required: false,
            displayName: "detailed",
            displayDescription: "Whether to send a list with detailed information.",
        },
    ],
    execute: pluginList,
    applicationId: "-1",
    inputType: 1,
    type: 1,
};

export const themeListCommand = {
    name: "theme-list",
    displayName: "theme list",
    description: "Send your theme list to the current channel",
    displayDescription: "Send your theme list to the current channel",
    options: [
        {
            name: "detailed",
            description: "Whether to send a list with detailed information.",
            type: 5,
            required: false,
            displayName: "detailed",
            displayDescription: "Whether to send a list with detailed information.",
        },
    ],
    execute: themeList,
    applicationId: "-1",
    inputType: 1,
    type: 1,
};

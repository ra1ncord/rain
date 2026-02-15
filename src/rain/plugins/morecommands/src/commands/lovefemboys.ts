import { showConfirmationAlert } from "@api/ui/alerts";
import { findByProps } from "@metro";

import { storage } from "../../storage";

const MessageActions = findByProps("sendMessage", "receiveMessage");
const Channels = findByProps("getLastSelectedChannelId");
const BotMessage = findByProps("createBotMessage");
const Avatars = findByProps("BOT_AVATARS");

function sendReply(channelID: any, content: any, embed: any) {
    const channel = channelID ?? Channels?.getChannelId?.();
    const msg = BotMessage.createBotMessage({
        channelId: channel,
        content: "",
        embeds: embed,
    });
    msg.author.username = "Astolfo";
    msg.author.avatar = "Astolfo";
    Avatars.BOT_AVATARS.Astolfo =
    "https://i.pinimg.com/736x/50/77/1f/50771f45b1c015cfbb8b0853ba7b8521.jpg";
    if (typeof content === "string") {
        msg.content = content;
    } else {
        Object.assign(msg, content);
    }
    MessageActions.receiveMessage(channel, msg);
}

export const lovefemboysCommand = {
    name: "lovefemboys",
    displayName: "lovefemboys",
    description: "Get an image of a femboy",
    displayDescription: "Get an image of a femboy",
    options: [
        {
            name: "nsfw",
            displayName: "nsfw",
            description: "Get the result from r/femboys instead of r/femboy (NSFW)",
            displayDescription:
        "Get the result from r/femboys instead of r/femboy (NSFW)",
            required: false,
            type: 5,
        },
        {
            name: "sort",
            displayName: "sort",
            description: "Changes the way reddit sorts.",
            displayDescription: "Changes the way reddit sorts",
            required: false,
            type: 3,
        },
        {
            name: "silent",
            displayName: "silent",
            description: "Makes it so only you can see the message.",
            displayDescription: "Makes it so only you can see the message.",
            required: false,
            type: 5,
        },
    ],
    applicationId: "-1",
    inputType: 1,
    type: 1,
    execute: async (args: any, ctx: any) => {
        try {
            // Some code taken from enmity gotfemboys plugin by spinfal & was modified with the help of meqativ
            const nsfw = args.find((arg: any) => arg.name === "nsfw")?.value;
            let sort = args.find((arg: any) => arg.name === "sort")?.value;
            const silent = args.find((arg: any) => arg.name === "silent")?.value;

            if (typeof sort === "undefined") sort = storage.sortdefs;
            if (
                !["best", "hot", "new", "rising", "top", "controversial"].includes(sort)
            ) {
                sendReply(
                    ctx.channel.id,
                    "Incorrect sorting type. Valid options are\n`best`, `hot`, `new`, `rising`, `top`, `controversial`.",
                    [],
                );
                return;
            }

            // Show NSFW warning popup only when nsfw option is selected
            if (nsfw) {
                const shouldProceed = await new Promise((resolve) => {
                    showConfirmationAlert({
                        title: "⚠️ NSFW Content Warning",
                        content:
              "This command will send NSFW (Not Safe For Work) content from r/femboys. Are you sure you want to continue?",
                        confirmText: "Yes, Continue",
                        onConfirm: () => resolve(true),
                        cancelText: "Cancel",
                        onCancel: () => resolve(false),
                    });
                });

                if (!shouldProceed) {
                    return null;
                }
            }

            let response = await fetch(
                `https://www.reddit.com/r/femboy/${sort}.json?limit=100`,
            ).then((res) => res.json());

            if (!ctx.channel.nsfw_ && nsfw && storage.nsfwwarn && !(silent ?? true)) {
                sendReply(
                    ctx.channel.id,
                    "This channel is not marked as NSFW\n(You can disable this check in plugin settings)",
                    [],
                );
                return;
            }

            if (nsfw) {
                response = await fetch(
                    `https://www.reddit.com/r/femboys/${sort}.json?limit=100`,
                ).then((res) => res.json());
            }

            response =
        response.data?.children?.[
            Math.floor(Math.random() * response.data?.children?.length)
        ]?.data;
            const author = await fetch(
                `https://www.reddit.com/u/${response?.author}/about.json`,
            ).then((res) => res.json());

            if (silent ?? true) {
                sendReply(ctx.channel.id, "", [
                    {
                        type: "rich",
                        title: response?.title,
                        url: `https://reddit.com${response?.permalink}`,
                        author: {
                            name: `u/${response?.author} • r/${response?.subreddit}`,
                            proxy_icon_url: author?.data.icon_img.split("?")[0],
                            icon_url: author?.data.icon_img.split("?")[0],
                        },
                        image: {
                            proxy_url:
                response?.url_overridden_by_dest?.replace(/.gifv$/g, ".gif") ??
                response?.url.replace(/.gifv$/g, ".gif"),
                            url:
                response?.url_overridden_by_dest?.replace(/.gifv$/g, ".gif") ??
                response?.url?.replace(/.gifv$/g, ".gif"),
                            width: response?.preview?.images?.[0]?.source?.width,
                            height: response?.preview?.images?.[0]?.source?.height,
                        },
                        color: "0xf4b8e4",
                    },
                ]);
            } else {
                const fixNonce = Date.now().toString();
                MessageActions.sendMessage(
                    ctx.channel.id,
                    {
                        content: response?.url_overridden_by_dest ?? response?.url,
                    },
                    void 0,
                    { nonce: fixNonce },
                );
            }
        } catch (err) {
            console.error("[LoveFemboys] Error:", err);
            sendReply(
                ctx.channel.id,
                "ERROR !!!!!!!!!!!! 😭😭😭 Check debug logs!! 🥺🥺🥺",
                [],
            );
        }
    },
};

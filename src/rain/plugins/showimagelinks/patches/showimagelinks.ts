import { findByName } from "@metro";
import { after } from "@api/patcher";

const RowManager = findByName("RowManager");

export function onLoad() {
    return after("generate", RowManager.prototype, ([row], { message }) => {
        if (row.rowType !== 1 || !message?.embeds || !message?.content) return;

        let imageCount = 0;
        const urls = [];
        for (const embed of message.embeds) {
            if (embed.type == "image" || embed.type == "gifv") {
                imageCount++;
                urls.push(embed.url);
            }
        }

        const linkContent = [];
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            linkContent.push({
                type: "link",
                content: [
                    {
                        type: "text",
                        content: url,
                    },
                ],
                target: url,
            });
            if (i < urls.length - 1) {
                linkContent.push({
                    type: "text",
                    content: "\n",
                });
            }
        }

        if (message.content.length == 0 && imageCount > 0) {
            message.content.push(...linkContent);
        }
    });
};
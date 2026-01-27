import { definePlugin } from "@plugins";
import { after, before } from "@api/patcher";
import { findByName, findByStoreName } from "@metro/wrappers";

type Unpatch = () => void;

const patches: Unpatch[] = [];
const emojiRegex = /https:\/\/cdn\.discordapp\.com\/emojis\/(\d+)\.\w+/;

function fixWebpUrl(url: string): string {
  if (url.includes('.webp') && url.includes('cdn.discordapp.com/emojis')) {
    return url.replace('.webp', '.gif');
  }
  return url;
}

export default definePlugin({
  name: "Realmoji",
  description: "Converts emoji image links back to real emojis",
  author: [{ name: "redstonekasi", id: 265064055490871297n }, { name: "rico040", id: 619474349845643275n }, { name: "cocobo1", id: 767650984175992833n }],
  id: "realmoji",
  version: "v1.0.0",
  start() {
    const EmojiStore = findByStoreName("EmojiStore");
    const RowManager = findByName("RowManager");
    
    if (!RowManager?.prototype) {
      return;
    }

    patches.push(
      before("generate", RowManager.prototype, ([data]) => {
        if (data.rowType !== 1) return;
        
        let content = data.message.content as string;
        if (!content?.length) return;
        
        const matchIndex = content.match(emojiRegex)?.index;
        if (matchIndex === undefined) return;
        
        const emojis = content.slice(matchIndex).trim().split("\n");
        if (!emojis.every((s) => s.match(emojiRegex))) return;
        
        content = content.slice(0, matchIndex);
        while (content.indexOf("  ") !== -1) {
          content = content.replace("  ", ` ${emojis.shift()} `);
        }
        
        content = content.trim();
        if (emojis.length) content += ` ${emojis.join(" ")}`;
        
        const embeds = data.message.embeds as any[];
        for (let i = 0; i < embeds.length; i++) {
          const embed = embeds[i];
          if (embed.type === "image" && embed.url.match(emojiRegex)) {
            embeds.splice(i--, 1);
          }
        }
        
        data.message.content = content;
        data.__realmoji = true;
      })
    );

    patches.push(
      after("generate", RowManager.prototype, ([data], row) => {
        if (data.rowType !== 1 || data.__realmoji !== true) return;
        
        const { content } = row.message as any;
        if (!Array.isArray(content)) return;
        
        const jumbo = content.every((c) => 
          (c.type === "link" && c.target.match(emojiRegex)) || 
          (c.type === "text" && c.content === " ")
        );
        
        for (let i = 0; i < content.length; i++) {
          const el = content[i];
          if (el.type !== "link") continue;
          
          const match = el.target.match(emojiRegex);
          if (!match) continue;
          
          const baseUrl = fixWebpUrl(match[0]);
          const url = `${baseUrl}?size=128`;
          const emoji = EmojiStore?.getCustomEmojiById?.(match[1]);
          
          const isAnimated = baseUrl.endsWith('.gif') || emoji?.animated;
          const frozenSrc = isAnimated 
            ? url.replace('.gif', '.png')
            : url;
          
          content[i] = {
            type: "customEmoji",
            id: match[1],
            alt: emoji?.name ?? "<realmoji>",
            src: url,
            frozenSrc: frozenSrc,
            jumboable: jumbo ? true : undefined,
            log_edit: false,
            otherPluginBypass: true,
          };
        }
      })
    );
  },
  stop() {
    patches.forEach((unpatch) => unpatch());
    patches.length = 0;
  }
});
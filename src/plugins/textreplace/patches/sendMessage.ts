import { findAssetId } from "@api/assets";
import { before } from "@api/patcher";
import { showToast } from "@api/ui/toasts";
import { logger } from "@lib/utils/logger";
import { findByProps } from "@metro";

import { useTextReplaceSettings } from "../storage";

const Messages = findByProps("sendMessage", "receiveMessage");

const Warning = findAssetId("ic_warning_24px");

export default function patchSendMessage() {
    return before("sendMessage", Messages, args => {
        // Rules, but filtering out ones with empty match arguments
        const rules = useTextReplaceSettings.getState().rules.filter(rule => rule.match);
        // The message content
        let content = args[1].content as string;

        // Go through each rule and run the message through it
        for (const rule of rules) {
            // If the rule is a regular expression, do regex logic
            if (rule.regex) {
                try {
                    // Create regexp
                    const pattern = new RegExp(rule.match, rule.flags);
                    // Replace
                    content = content.replace(pattern, rule.replace);
                } catch (e) {
                    // Log error
                    logger.error(e);
                    // Notify user
                    showToast(`Failed to use RegExp for ${rule.name}!`, Warning);
                }
            } else {
                // Normal logic
                content = content.replaceAll(rule.match, rule.replace);
            }
        }

        // Update message content with the updated content
        args[1].content = content;
    });
}

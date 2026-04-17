import { before } from "@api/patcher";
import { findByProps } from "@metro/wrappers";

import { cleanUrl } from "./rules";

const HTTP_REGEX_MULTI = /https?:\/\/[^\s<>]+[^<.,:;"')\]\s]/g;

type Unpatch = () => void;

function clean(text: string): string {
    return text.replace(HTTP_REGEX_MULTI, str => {
        let url: URL;
        try {
            url = new URL(str);
        } catch {
            return str;
        }
        return cleanUrl(url.toString());
    });
}

function handleMessage(msg: any) {
    if (msg?.content) {
        msg.content = clean(msg.content);
    }
}

export function setupPatches(): Unpatch[] {
    const patches: Unpatch[] = [];

    try {
        const Messages = findByProps("sendMessage", "editMessage", "startEditMessage");

        if (Messages?.sendMessage) {
            patches.push(
                before("sendMessage", Messages, args => {
                    handleMessage(args[1]);
                })
            );
        }

        if (Messages?.editMessage) {
            patches.push(
                before("editMessage", Messages, args => {
                    handleMessage(args[2]);
                })
            );
        }

    } catch (e) {
    }

    return patches;
}

import { createPluginStore } from "@api/storage";

import type { Rule } from "./def";

export interface TextReplaceSettings {
    rules: Rule[]
}

export const {
    useStore: useTextReplaceSettings,
    settings: textReplaceSettings,
} = createPluginStore<TextReplaceSettings>("TextReplace", {
    rules: [],
});
